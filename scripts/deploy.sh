#!/usr/bin/env bash
#
# 一键更新 psray-web：拉取、安装依赖、构建，再无缝切换到新版本。
#
# 用法（必须用 root 执行）：
#   sudo /var/www/psray-web/scripts/deploy.sh             # 有新提交才更新
#   sudo /var/www/psray-web/scripts/deploy.sh --force     # 没有新提交也重新构建并切换
#   sudo /var/www/psray-web/scripts/deploy.sh --rollback  # 切回上一个版本（不拉代码、不构建）
#
# 怎么做到无缝：
#   - 构建与运行分离。nuxt build 会先清空 .output 再生成，以前线上直接跑 .output，
#     整个构建期间都是 500。现在构建产物复制到 $RELEASES/<时间>-<提交>/，线上只跑那里的副本。
#   - 蓝绿切换。psray-web@3630 / psray-web@3631 两个实例轮流上岗，各跑 slot-<端口> 指向的版本。
#     新版本在空闲端口启动、首页返回 200 后，才改写 nginx 的 upstream（$ACTIVE_INC）并 reload——
#     reload 是平滑的，进行中的请求由旧 worker 处理完。等 DRAIN_SECONDS 秒再停旧实例，
#     Nitro 收到 SIGTERM 也会先处理完手头请求。
#   - 空闲实例的 slot 仍指向上一个版本，--rollback 就是反向再切一次。
#   - 任何一步失败都在切换前退出：线上仍是旧版本，新起的实例会被停掉。
#
# 为什么要 root：GitHub 凭据只在 /root/.git-credentials，所以只有 fetch / merge 以 root 执行，
# 合并后立即把整个目录 chown 回 psray；安装、构建一律 `sudo -u psray -H`。
# systemctl / nginx 本来就需要 root。
#
# 首次使用前需要一次性改 nginx 配置，见 psray-api 仓库 docs/deploy.md「psray-web 无缝更新」。
#
# 整个流程包在 main 里、最后一行才调用：git merge 可能改写本文件，bash 是边读边执行脚本的，
# 先把函数整体读进内存才能保证执行的是合并前的这一版。

set -Eeuo pipefail

# 交互终端里 git log 会走 less；若环境里 LESS 不含 -F（如 oh-my-zsh 设的 -R），空输出也要按 q 才继续
export GIT_PAGER=cat

APP_USER=psray
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASES=/var/www/psray-web-releases
ACTIVE_INC=/etc/nginx/psray-web-active.inc
UNIT=psray-web@.service
LEGACY_UNIT=psray-web.service   # 蓝绿之前的单实例服务，首次切换后停用
PORTS=(3630 3631)
KEEP_RELEASES=5
DRAIN_SECONDS=${DRAIN_SECONDS:-15}

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
as_app() { sudo -u "$APP_USER" -H "$@"; }

# 已启动但尚未接流量的新实例；失败退出时停掉它
pending_port=''
switched=0
# 切换前改过指向的 slot 及其原指向；没切换成功就还原，空闲 slot 才能一直指向上一个好版本
retargeted_port=''
retargeted_from=''
on_error() {
    printf '\n\033[1;31m✗ 第 %s 行的命令失败：%s\033[0m\n' "$1" "$2" >&2
    if [[ $switched == 1 ]]; then
        printf '\033[1;33m! 已切换到新版本，失败发生在切换之后（停旧实例或清理），线上不受影响。\033[0m\n' >&2
    else
        printf '\033[1;33m! 尚未切换，线上仍是原来的版本。\033[0m\n' >&2
    fi
}
on_exit() {
    if [[ -n $pending_port ]]; then
        systemctl stop "psray-web@$pending_port" || true
    fi
    if [[ $switched == 0 && -n $retargeted_port ]]; then
        if [[ -n $retargeted_from ]]; then
            ln -sfn "$retargeted_from" "$RELEASES/slot-$retargeted_port"
            chown -h "$APP_USER:$APP_USER" "$RELEASES/slot-$retargeted_port"
        else
            rm -f "$RELEASES/slot-$retargeted_port"
        fi
    fi
    # root 跑过 git status / fetch 也会改写 .git 里的文件，无论成败退出前都归还属主
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
}

active_port() {
    local port
    port=$(grep -oE '127\.0\.0\.1:[0-9]+' "$ACTIVE_INC" | head -1 | cut -d: -f2 || true)
    [[ " ${PORTS[*]} " == *" $port "* ]] || die "$ACTIVE_INC 里的端口（${port:-空}）不是 ${PORTS[*]} 之一"
    echo "$port"
}

other_port() {
    [[ $1 == "${PORTS[0]}" ]] && echo "${PORTS[1]}" || echo "${PORTS[0]}"
}

preflight() {
    [[ -f $ACTIVE_INC ]] || die "缺少 $ACTIVE_INC。首次使用前需改 nginx 配置，见 psray-api 的 docs/deploy.md。"
    # 不用 grep -q：它提前退出会让 nginx -T 收到 SIGPIPE，pipefail 下整条管道判为失败
    nginx -T 2>/dev/null | grep -F "include $ACTIVE_INC;" >/dev/null \
        || die "nginx 的 upstream psray_web 没有 include $ACTIVE_INC，见 psray-api 的 docs/deploy.md。"
    command -v curl >/dev/null || die "需要 curl 做健康检查"

    install -d -o "$APP_USER" -g "$APP_USER" "$RELEASES"

    # 单元文件随仓库走，有变化才装
    if ! cmp -s "$APP_DIR/deploy/$UNIT" "/etc/systemd/system/$UNIT"; then
        install -m 644 "$APP_DIR/deploy/$UNIT" "/etc/systemd/system/$UNIT"
        systemctl daemon-reload
        echo "已安装 /etc/systemd/system/$UNIT"
    fi
}

health_check() {
    local port=$1 code
    for _ in $(seq 30); do
        code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:$port/" || true)
        [[ $code == 200 ]] && return 0
        sleep 1
    done
    echo "最后一次响应：HTTP ${code:-无}" >&2
    return 1
}

# 把源码目录的 .output 存为版本（名字后缀 $2），并让 slot-$1 指向它
save_release() {
    local port=$1 suffix=$2 release
    release="$RELEASES/$(date -u +%Y%m%d-%H%M%S)-$suffix"
    [[ ! -e $release ]] || die "$release 已存在"
    as_app cp -a .output "$release"
    retargeted_port=$port
    retargeted_from=$(readlink "$RELEASES/slot-$port" || true)
    as_app ln -sfn "$release" "$RELEASES/slot-$port"
    echo "$(basename "$release") → slot-$port"
}

# 启动 $1 端口上的实例，健康后把 nginx 切过去，再停掉 $2 端口上的旧实例
switch_to() {
    local target=$1 old=$2

    step "启动 psray-web@$target（$(basename "$(readlink -f "$RELEASES/slot-$target")")）"
    pending_port=$target
    systemctl restart "psray-web@$target"
    if ! health_check "$target"; then
        journalctl -u "psray-web@$target" -n 30 --no-pager >&2 || true
        die "psray-web@$target 健康检查失败，未切换"
    fi

    step "nginx 切换到 $target"
    cp "$ACTIVE_INC" "$ACTIVE_INC.bak"
    printf 'server 127.0.0.1:%s;\n' "$target" > "$ACTIVE_INC.tmp"
    mv "$ACTIVE_INC.tmp" "$ACTIVE_INC"
    if ! nginx -t -q; then
        mv "$ACTIVE_INC.bak" "$ACTIVE_INC"
        die "nginx -t 失败，已还原 $ACTIVE_INC，未切换"
    fi
    systemctl reload nginx
    rm -f "$ACTIVE_INC.bak"
    pending_port=''
    switched=1
    systemctl enable -q "psray-web@$target"   # 开机启动接流量的那个

    step "等待 ${DRAIN_SECONDS}s 后停止旧实例"
    sleep "$DRAIN_SECONDS"
    if systemctl is-active -q "$LEGACY_UNIT"; then
        systemctl disable -q --now "$LEGACY_UNIT"
        echo "已停用迁移前的单实例服务 $LEGACY_UNIT"
    fi
    systemctl disable -q --now "psray-web@$old" 2>/dev/null || true
}

# 保留最新 KEEP_RELEASES 个版本，以及两个 slot 正在指向的版本
prune_releases() {
    local keep=() dir
    for port in "${PORTS[@]}"; do
        [[ -L $RELEASES/slot-$port ]] && keep+=("$(readlink -f "$RELEASES/slot-$port")")
    done
    while IFS= read -r dir; do
        keep+=("$dir")
    done < <(find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -name '[0-9]*' | sort -r | head -n "$KEEP_RELEASES")

    find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -name '[0-9]*' | while IFS= read -r dir; do
        [[ " ${keep[*]} " == *" $dir "* ]] || { rm -rf "$dir"; echo "已清理旧版本 $(basename "$dir")"; }
    done
}

main() {
    local mode=deploy
    case "${1:-}" in
        --force) mode=force ;;
        --rollback) mode=rollback ;;
        '') ;;
        *) die "未知参数：$1（只支持 --force / --rollback）" ;;
    esac

    [[ $EUID == 0 ]] || die "请用 root 执行：sudo $0"
    trap 'on_error $LINENO "$BASH_COMMAND"' ERR
    trap on_exit EXIT
    exec 9>/run/psray-web-deploy.lock
    flock -n 9 || die "另一个部署正在进行"
    cd "$APP_DIR"

    preflight
    local active target
    active=$(active_port)
    target=$(other_port "$active")

    if [[ $mode == rollback ]]; then
        [[ -L $RELEASES/slot-$target && -d $(readlink -f "$RELEASES/slot-$target") ]] \
            || die "slot-$target 没有指向可用的版本，无法回滚"
        echo "当前：$(basename "$(readlink -f "$RELEASES/slot-$active" 2>/dev/null || echo '?')")（:$active）"
        echo "回滚到：$(basename "$(readlink -f "$RELEASES/slot-$target")")（:$target）"
        switch_to "$target" "$active"
        printf '\n\033[1;32m✓ 已回滚到 %s\033[0m\n' "$(basename "$(readlink -f "$RELEASES/slot-$target")")"
        exit 0
    fi

    step "检查工作区"
    [[ -z "$(git status --porcelain --untracked-files=no)" ]] \
        || die "工作区有未提交的改动，请先处理：git -C $APP_DIR status"

    step "拉取远端"
    git fetch --quiet
    local old new
    old=$(git rev-parse HEAD)
    new=$(git rev-parse '@{u}')
    # 远端已包含在本地（相同，或本地有未推送的提交）→ 没有可拉的；两边各有新提交 → ff-only 必然失败
    if git merge-base --is-ancestor "$new" "$old"; then
        if [[ $mode != force ]]; then
            echo "已是最新（$(git log -1 --format='%h %s')），无需更新。"
            [[ $old == "$new" ]] || echo "注意：本地有未推送的提交：git -C $APP_DIR log --oneline @{u}..HEAD"
            exit 0
        fi
        echo "没有新提交，--force 继续执行。"
    elif ! git merge-base --is-ancestor "$old" "$new"; then
        die "本地与远端已分叉，无法快进合并，请先手动处理：git -C $APP_DIR status"
    else
        git log --oneline "$old..$new"
        git merge --ff-only --quiet '@{u}'
    fi
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"

    # 首次部署：线上还是迁移前的单实例服务，直接跑源码目录里的 .output，构建一清空它就是 500。
    # 先把这份 .output 存为版本、在空闲端口跑起来并切过去，再开始构建；它也是第一次部署后的回滚目标。
    if systemctl is-active -q "$LEGACY_UNIT"; then
        [[ -f .output/server/index.mjs ]] || die "$LEGACY_UNIT 在运行，但 .output 里没有可接管的构建"
        step "迁移：线上切到当前版本的副本，构建期间不受影响"
        save_release "$target" initial
        switch_to "$target" "$active"
        switched=0
        retargeted_port=''
        active=$target
        target=$(other_port "$active")
    fi

    step "安装依赖"
    as_app pnpm install --frozen-lockfile

    step "构建（线上不受影响）"
    as_app pnpm build

    step "保存版本"
    save_release "$target" "$(git rev-parse --short HEAD)"

    switch_to "$target" "$active"

    step "清理旧版本"
    prune_releases

    printf '\n\033[1;32m✓ 更新完成：%s（:%s）\033[0m\n' "$(git log -1 --format='%h %s')" "$target"
    echo "如需回滚：sudo $APP_DIR/scripts/deploy.sh --rollback"
}

main "$@"
exit
