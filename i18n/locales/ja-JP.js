export default {
  cookie: {
    banner: {
      message: '当サイトでは、ユーザー体験の向上のためにクッキーを使用しています。続行すると、クッキーの使用に同意したものとみなされます。',
      accept: '同意する',
      reject: '拒否する',
      learn_more: '詳細',
    }
  },
  legal: {
    title: 'プライバシー',
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
    delete: 'データの削除を依頼',
    privacy_desc: '当サイトのデータ収集・利用・保存について。',
    terms_desc: 'ユーザーの義務と許容される利用。',
    delete_desc: '個人データの恒久的な削除を依頼します。'
  },
  appMenu: {
    "home": "ホーム",
    "leaderboard": "リーダーボード",
    "trophy_set": "PSN トロフィー",
    "game": "ゲーム",
    "laboratory": "ラボ",
    "forum": "フォーラム",
    "store": "ストア",
    "anti_cheating": "アンチチート",
    "public_log": "トロフィンログ",
    "about": "PSRay について",
  },
  userMenu: {
    login: "ログイン",
    register: "新規登録",
    profile: "マイプロフィール",
    sync: "ゲーム同期",
    home: "ホーム",
    settings: "アカウント設定",
    contributions: "データ貢献",
    admin_panel: "管理者パネル",
    logout: "ログアウト",
  },
  // 共通
  common: {
    "login": "ログイン",
    "sign_up": "新規登録",
    "sign_up_now": "今すぐ無料登録",
    "platinum": "プラチナ",
    "gold": "ゴールド",
    "silver": "シルバー",
    "bronze": "ブロンズ",
  },
  // ユーザーダッシュボード
  dashboard: {
    "level": "レベル",
    "joined": "加入日",
    "my_tips": {
      "name": "私の投稿したTip",
      "release_date": "公開日",
      "helpful": "{vote}人が役に立ったと思っています",
      "button": "表示",
    },
    "following_users": {
      "name": "フォローしているユーザー",
      "following": "フォロー中",
      "mutual": "相互フォロー中",
      "button": "プロフィールを見る",
    },
    "my_followers": {
      "name": "私のフォロワー",
      "follow_you": "あなたをフォローしました",
      "mutual": "相互フォロー中",
      "button": "プロフィールを見る",
    },
    "profile_card": {
      "name": "プロフィールカード",
      "text": "現在作成中、お楽しみに"
    }
  },
  // アカウント設定
  setting: {
    "name": "個人設定",
    "warning_text": "個人設定ページはまだ作り直し中で、現在設定できる内容は以下の通りです。",
    "profile": {
      "name": "プロフィールページ",
      "calendar": {
        "is_enabled": "私のプロフィールページに最近の活動カレンダーを表示",
      },
      "sync": {
        "interval": "プロフィール同期間隔",
        "description": "現在、{interval}時間ごとにPSNと自動的にプロフィールを同期しています。",
        "next_update": "次回更新予定",
        "change": "変更",
        "button": "更新",
        "disabled": "自動更新は無効になっています",
      },
      "linked_account": {
        "name": "プロフィールページに他のゲームプラットフォームを表示",
        "description_1": "いくつかの一般的なゲームプラットフォームを関連付けて、他の人にあなたを知ってもらうことができます",
        "description_2": "ログインは不要で、対応するプラットフォームIDを入力するだけで、プロフィールページにリンクが生成されます",
        "description_3": "削除または非表示にする場合は空白のままにしてください",
        "custom_id_example": "Steam カスタムコミュニティIDの例",
        "steam_64bit_example": "Steam 64ビットIDの例",
        "xbox_id_example": "Xbox IDの例",
        "ns_example": "例",
        "red_text_only": "赤字の部分のみ記入してください",
        "button": "更新",
      },
    },
    "password": {
      "name": "パスワード変更",
      "old_pass": "旧パスワード",
      "new_pass": "新パスワード",
      "confirm": "再入力",
      "condition": {
        "requre_1": "1文字を含む",
        "requre_2": "1つの数字を含む",
        "requre_3": "最小8文字",
      },
      "button": "パスワードを更新",
    },
  },
  // ホームページ
  home: {
    "breadcrumbs": "",
    "title": "PSRay へようこそ",
    "description_1": "ここでは、PSNのトロフィーを記録し、ゲームの感想を交流し、攻略を探し、新しい友達が作れます",
    "description_2": "PSRay（アルファ）はまだ開発段階にあり、サイト内の機能は未完成です",
    "sync_psn_account": "PSNゲームを更新する",
    "function_card": {
      "player_leaderboard": "プレイヤーランキング",
      "search_trophies": "PSNトロフィーを探す",
      "rate_games": "ゲームを評価する",
      "game_walkthroughs": "攻略を探す",
      "find_friends": "友達を見つける",
      "find_answers": "答えを探す",
    },
    "card_1": {
      "text_1": "3分で",
      "text_2": "あなたのPSN個人ページを作成できます",
    },
    "card_2": {
      "text_1": "プレイヤーから生まれ、プレイヤーのためのサービス",
      "text_2": "PSRayの一員になるのは大歓迎です",
      "logged_in_text": "こんにちは",
      "my_ranking": "私のランキング"
    },
    "recent_sync": {
      "title": "最近同期されたプレイヤー",
      "empty": "データなし",
      "error": "読み込み失敗"
    }
  },
  // プロフィール 更新ページ
  sync: {
    "title": "プロフィール更新",
    "sub_title": "PSN IDを入力して同期を開始してください",
    "button": "プロフィールを更新",
    "success": {
      "title": "同期キューに追加されました",
      "text_1": "あなたの同期タスクはPSRayのバックエンドキューにあります。",
      "text_2": "ゲームの同期はキュー順に実行され、完了するまでに少し時間がかかる場合があります。",
      "button": "{psnid}のプロフィールページに移動"
    },
    "message": {
      "title": "現在、隠されたゲームの同期ができません",
      "text_1": "アカウントを非公開に設定し、その後一度同期すると、すべてのゲームが隠されます。",
      "text_2": "公開プロフィールに変更した後、再度同期してください。これにより、ゼロから同期が始まります。",
      "text_3": "今後、この問題を修正します。"
    },
    "syncing_text": "同期リクエストを送信中"
  },
  // ランキングページ
  leaderboard: {
    "title": "PSRay リーダーボード"
  },
  // トロフィー
  trophies: {
    // トロフィーページ
    "version": "バージョン",
    "created_at": "登録日",
    "updated_at": "最終更新",
    "tags": "トロフィーセットタグ",
    "game_info": "ゲーム情報",
    "view_game_details": "ゲーム情報を見る",
    "related_trophy_set": "バージョン/地域",
    "player_ranking": "プレイヤーランキング",
    "first_achievers": "最速達成ランキング",
    "fastest_completed": "最短時間トロコンランキング",
    "contribute": {
      "title": "データ編集は歓迎します！",
      "text_1": "参加したユーザーには様々な報酬を用意しています。",
      "text_2": "このゲームを知っているなら:",
      "can_do_1": "異なるプラットフォームや地域のトロフィーセットを関連できる",
      "can_do_2": "トロフィーセットにタグを追加できる",
      "editing_button": "トロフィーセットを編集"
    },
    "how_long_to_beat": {
      "title": "時間と難易度",
      "text_1": "データはPSRayプレイヤーが提供した平均値で、実際とは異なる場合があります。",
      "text_2": "バージョンアップや新しいDLCの発売により、難易度や時間が変わる可能性があります。",
      "story_playtime": "ストーリー予想平均時間",
      "platinum_playtime": "プラチナ予想平均時間",
      "playthrough": "必要な周目",
      "difficulty": "難易度",
      "share_my_time": "自分のプレイ時間を共有する",
      "detail_button_text": "詳細を見る",
    },
    "recent_players": "最近プレイした人",
    "all_recent_players": "最近プレイした人を表示する",
    "statistics": "プレイヤー統計",
    "played": "プレイした",
    "platinum_achievers": "プラチナ達成者数",
    "completed_players": "トロコン者数",
    "average_progress": "平均完成度",
    "player_trophy_status": "プレーヤー進み具合",
    "first_trophy": "最初のトロフィー",
    "last_trophy": "最後のトロフィー",
    "duration": "プレイ時間",
    "earned_trophies": "獲得したトロフィー",
    "unearned_trophies": "未獲得のトロフィー",
    "translations": "トロフィーセット翻訳",
    "sort": {
      "default": "デフォルト",
      "date": "取得日時",
      "psn-rarity": "PSN レア度",
    },
    "filter": {
      "all": "すべて",
      "earned": "獲得済み",
      "unearned": "未獲得",
    },
    // トロフィーグループ概要ページ
    overview: {
      "title": "トロフィーグループ",
      "search": "トロフィーグループを検索",
      "search_tip": "検索語は2文字以上である必要があります",
      "summary": {
        "title": "概要",
        "trophy_set_count": "トロフィーグループの数",
        "translations": "翻訳されたトロフィーグループ数",
        "trophy_count": "トロフィーの数",
        "game_play_count": "ゲーム記録"
      },
      "data": {
        "title": "データ",
        "platform": "プラットフォーム",
        "fetched_trophy_set": "取得されたトロフィーグループ数",
        "language": "言語",
        "localizations": "トロフィーグループの翻訳とローカライズ",
      },
      "popular": "人気のトロフィーグループ",
      "playing": "最近プレイしている人数: {headcount} 人",
      "recent": "最近追加されたトロフィーグループ",
    },
    // トロフィーグループ検索ページ
    search: {
      "title": "データベースからトロフィーグループを検索",
      "button": "検索",
      "open_search_result": "トロフィーグループを見る",
      "help_text_1": "現在、基本的な検索機能のみ提供しています",
      "help_text_2": "検索文字は最低2文字必要です",
      "help_text_3": "単一のキーワードであいまい検索が可能です",
      "help_text_4": "簡体字と繁体字は互換性がありません",
      "help_text_5": "フィルター、並べ替え機能はまだ完成していません",
      "help_text_6": "現在、検索構文や関連度マッチングはありません",
      "view_button": "トロフィーグループを見る",
    },
    // トロフィーグループランキングページ
    ranking: {
      "first_achievers": "最速達成者ランキング",
      "fastest_completed": "最短時間トロコンランキング",
      "recent_players": "最近プレイ中",
    },
  },
  // トロフィーページ
  trophy: {
    "tips": {
      "title": "コミュニティTips",
      "description_html": "取得方法や経験、コツを共有して、他のプレイヤーがトロフィーを獲得しやすくなるように助けましょう。",
      "not_good_1": "評価、批評、質問、記念",
      "good_1": "トロフィー取得方法",
      "good_2": "注意事項",
      "warning": "このトロフィーに関係ない内容は投稿しないでください。ルールに従わない場合、関連内容は非表示にされます。",
      "not_posted_yet": "このトロフィーにはまだ投稿がありません。",
      "write_new_tip_button": "私のTipsを投稿",
      "posted": "このトロフィーに関して投稿済みです。",
      "edit_button": "私のTipを編集",
      "delete_button": "削除",
      "hidden_editor": "エディタを隠す",
      "not_logged_in": "ログイン後、あなたのTipsを共有できます。",
      "edit_my_tip": "私のTipを編集",
    },
    "tip": {
      "post_date": "投稿日",
      "edited_date": "編集日",
      "language": "使用言語",
      "is_helpful": "このTipは役に立ちましたか？",
      "like": "{count} 人がこのTipを役に立つと評価しました。",
      "dislike": "{count} 人が気に入りませんでした。",
      "mark": {
        "name": "ユーザーマーク",
        "spoiler": "このTipにはネタバレが含まれています。",
        "missable": "このトロフィーは取得し損ねる可能性があります。",
        "unmissable": "このトロフィーは取得し損ねません。",
      }
    },
    "tip_editor": {
      "language": "Tipの使用言語を選択",
      "missable": "取得し損ねる可能性あり",
      "spoilers": "ネタバレあり",
      "post_button": "投稿",
    },
    "players": {
      "back_1": "前のページに戻る",
      "back_2": "トロフィーページに戻る",
      "fastest": "最速取得",
      "recent": "最近取得",
    }
  },
  // ゲームページ
  game: {
    "upcoming": "今後発売予定のゲーム",
    "recently_added": "最近追加されたゲーム",
    "description_1": "PSRayはPSNプレイヤー向けのゲームデータベースです。ゲームの発売、制作、ダウンロードサービスは提供していません。ゲームを販売することもありません。",
    "description_2": "PSRayのすべてのゲームデータはIGDB.comから取得されています。これは公開データベースサービスです。",
  },
  // フォーラム
  forum: {
    "title": "PSRay フォーラム",
    "warning_text_1": "おっと、PSRayのフォーラム機能はまだ構築中です",
    "warning_text_2": "準備した臨時フォーラムをご利用いただけます",
    "text_1": "注意：メインサイトのアカウントは臨時フォーラムのアカウントとは別です",
    "text_2": "臨時フォーラムは現在バグ報告や意見提出用です",
    "text_3": "臨時フォーラムのデータは、正式フォーラムが完成後に削除されます",
    "text_4": "臨時フォーラムはflarumオープンソースプログラムを使用して構築されています",
    "button": "臨時フォーラムへ"
  },
  // 交換
  store: {
    "title": "PSRay交換所へようこそ",
    "description_1": "PSRayでは、クリエイターやアクティブユーザーにいくつかの報酬を提供します。",
    "description_2": "ここでは、PSRayコミュニティで得た報酬を使って、必要なアイテムを交換することができます。",
    "description_3": "交換可能なアイテムは定期的に更新されます。同じアイテムの交換回数は、更新後にリセットされます。",
    "balance": "私の交換可能なPSRay通貨",
    "balance_text": "コミュニティラボで、入手方法を確認できます。",
    "remaining": "残り",
    "require_item": "交換に必要なアイテム",
    "capacity": "総数",
    "stock": "在庫",
    "gift_card": {
      "name": "PSNチャージカードを交換",
      "text_1": "必要に応じて、同等価値の他地域のチャージカードや現金報酬に交換できます。",
      "text_2": "第1期の交換期間: {date}。一人あたり最大で{limit}価値のアイテムを交換できます。"
    },
    "view": "詳細を見る",
    // 交換ページ
    "redeem": {
      "title": "報酬の交換",
      "text_1": "すべての報酬は透明かつ公平に配布されます。交換履歴は公開され、誰でもあなたの交換履歴を見ることができます。",
      "text_2": "交換後、あなたのプロフィールページに表示されている総数は減算されません。交換済みの部分は「使用済み」とマークされます。",
      "text_3": "報酬の入手方法：コミュニティラボで入手方法を確認できます。",
      "not_redeemed": "このアイテムはまだ交換されていません。",
      "redeemed": "すでに交換済み",
      "redeemed_date": "交換日時",
      "obtaining": "現在、報酬は手動で配布されているため、以下の連絡先を通じて報酬を受け取ってください。",
      "button": "今すぐ交換",
      "record": "このアイテムの交換履歴",
      "redeemer": "交換者（PSNID）",
      "redemption_time": "交換日時",
      "quantity": "数量"
    }
  },
  // アンチチート
  anti_cheat: {
    "title": "反チート",
    "pinned": "PSRayはチート/改造検知を提供します。現在、具体的な詳細については議論と意見収集が行われています。",
    "text_1": "コミュニティリーダーボードの相対的な公平性を確保するために、PSRayは[手動+自動化]検知を採用します。",
    "text_2": "すべての手動禁止および自動化チート検知の警告記録は公開され、誰でも閲覧可能です。",
    "ban_record": "禁止記録の照会",
    "card_1": "チートプレイヤーの削除数",
    "card_2": "ランキング禁止プレイヤーの数",
    "description": {
      "title": "説明",
      "text_1": "反チートの核心的な目的は、リーダーボード上のコアプレイヤーのモチベーションを保護することです。これには総合ランキングとトロフィーグループランキングが含まれます。",
      "text_2": "PSRayは皆さんが正常にゲームをプレイすることを望んでいます。PSRayは不正な手段が使用されているかどうかを検知することはできません。すべての判断は、トロフィー取得のタイムスタンプ、取得順序、取得間隔に基づいています。",
      "text_3": "PSRayはトロフィー取得の方法が「合法」であるかどうかを気にしません。ランキングに適さない記録、例えばゲストアカウントからのトロフィー転送などは、反チートシステムによって削除または警告されます。",
      "text_4": "PSRayは過去の記録やすでに隠された記録については追及しません。PSRayはデータ収集を遅く始めたため、他のサイトで禁止され、禁止の原因となるトロフィーグループが隠されている場合、問題はないと見なされます。",
      "text_5": "ゲーム内のバグを利用して反チートが発動した場合、合理的な再現方法を提供すれば申訴が可能です。管理チームが投票して判断します。"
    },
    "level": {
      "title": "レベル",
      "description": "システムをいくつかのレベルに分けており、取られる措置も異なります。",
      "table_head": "レベル",
      "measures": "対応措置",
      "warning": "警告",
      "suspension": "ランキング停止",
      "ban": "ランキング禁止",
      "termination": "アカウント停止",
      "warning_text": "システムが自動的に記録しますが、措置はありません。過度にトリガーされると、管理チームが手動で調査する可能性があります。",
      "suspension_text": "ランキングを一時的に隠します。警告のゲーム後すぐにランキングを復元できます。",
      "ban_text": "ランキングへの参加を永久に禁止されますが、サイト内機能は使用可能です。",
      "termination_text": "アカウントを削除します。このPSNIDは今後の同期、ランキング、登録が禁止されます。"
    },
    "components": {
      "title": "システム構成",
      "description": "反チートシステムを3つの部分に分けて実行することが一時的に決定されました。どのような状況でもユーザーは申訴できます。",
      "text_1": "同期時の自動化検知：事前に設定されたルールに基づいて、トロフィー取得の時間が論理的かどうかをチェックします。",
      "text_2": "コミュニティプレイヤーの報告：コミュニティプレイヤーによって報告されます。管理チームは報告者と報告されたユーザーの証拠に基づいて判断し、最終的な結果を決定します。",
      "text_3": "管理チームによる手動処理：管理チームが直接禁止します。一般的に、特に明らかなチート行為に対して行われます。"
    },
    "auto_detection": {
      "title": "自動化検知",
      "text_1": "開発段階中ですので、最新情報を得るためにお知らせをフォローしてください。",
      "text_2": "ユーザーがトロフィーを同期する際に自動的に実行されます。自動化判断ルールは公開され、誰でも新しいルールを作成でき、そのルールはコミュニティ投票によって承認されます。",
      "text_3": "バージョン更新などの理由で、すでに適用されなくなった古いルールは、削除のための投票を開始できます。"
    },
    "appeal": {
      "title": "申訴",
      "text_1": "申訴システムはまだ完成していません。質問がある場合は、管理チームのメールでお問い合わせください。"
    },
    // Anti Cheat Records Page
    "records": {
      "title": "反チートシステム記録",
      "description": "特定のPSNIDの禁止記録を検索する機能は、次回の更新後に提供されます。",
      "last_updated": "最終更新日",
      "respondent": "処理対象",
      "type": {
        "name": "種類",
        "moderators_ban": "管理者による手動禁止"
      },
      "cause": {
        "name": "原因",
        "cheating": "トロフィー改造/チート"
      },
      "judge": "承認管理者",
      "level": "処理レベル",
      "measures": "影響",
      "explanation": "説明"
    }
  },
  // 公開ログ
  public_log: {
    "title": "トロフィー更新記録"
  },
  // PSRay について
  about: {
    "title": "PSRay について",
    "heading": "PSRay へようこそ。ここはPSNゲームプレイヤー同士が交流できるウェブサイトです。",
    "description_1": "ゲームの旅を共有し、あなたのゲームプロフィールを作成しましょう。",
    "description_2": "自分のスタイルに合ったゲームやプレイヤーを見つけ、ここであなたの宝物を見つけられると信じています。",
    "description_3": "コツやテクニックを共有して、他のプレイヤーが障害を乗り越えられるようサポートしましょう。",
    "chat_groups": "公式チャットグループ",
    "teams": "PSRay チーム",
    "programming": "プログラミング",
    "moderators": "コミュニティモデレーター",
    "special_thanks": "オープンソースプロジェクトに感謝を",
    "icon_license": "アイコン ライセンス",
  },
  // Player Profile
  profile: {
    "registered": "PSRayメンバー",
    "followed": "フォロー中",
    "unfollow": "フォロー解除",
    "follow_you_back": "相互フォロー",
    "sync_psn_trophies": "PSNトロフィーを同期する",
    "follow": "フォローする",
    "page_view": "ページビュー",
    "following": "フォロー中",
    "followers": "フォローワー",
    "contribution_rewards": "コミュニティー点数",
    "star_piece": "ほしのかけら",
    "rare_candy": "ふしぎなアメ",
    "philosophers_stone": "賢者の石",
    "mira": "ミラ",
    "next_auto_update_time": "次の自動更新時間",
    "auto_update_disabled": "自動更新が無効化されました",
    "linked_game_account": "連携アカウント",
    "milestones": "マイルストーン",
    "ranking": "ランキング",
    "server_location": "サーバー",
    "server_rannking": "サーバーランキング",
    "last_update_at": "最終更新時間",
    "last_trophy_earned_at": "最後のトロフィー時間",
    "trophy": "トロフィー",
    "first_trophy_earned_at": "最初のトロフィー時間",
    "psn_level": "PSNレベル",
    "earned_trophies_count": "獲得したトロフィー数",
    "game": "ゲーム",
    "game_played": "プレイしたゲーム",
    "completion_rate": "完了率",
    "less_than_10": "進度低いゲーム",
    "trophy_tips": "トロフィーコツ",
    "trophy_calendar": "トロフィーカレンダー",
    "trophy_calendar_description": "最近一年のトロフィー記録",
    "swipe_left": "左にスワイプして全てを表示",
    "recently_played": "最近プレイしたゲーム",
  },
  // ログインページ
  login: {
    "account": "アカウント (PSNID)",
    "password": "パスワード",
    "button": "ログイン",
    "no_account_held": "まだPSRayアカウントはありませんか？",
    "success": {
      "syncing_message": "ログイン成功、アカウント情報を同期中です。",
      "welcome_message": "お帰りなさい、{psnid}さん。5秒後にホームページに移動します。"
    }
  },
  // 会員登録ページ
  sign_up: {
    "step_1": {
      "name": "あなたのPSN IDが利用可能か確認してください",
      "title": "PSRayアカウントを作成",
      "heading": "PlayStation Network IDで登録",
      "description": "現在、登録には制限があります。以下の条件を満たす必要があります。",
      "condition_1": "PSNはすでにこのサイトで一度同期されています。同期がない場合は、まず同期ページで同期してください。",
      "condition_2": "PSNレベルは100に達しています。",
      "condition_3": "PSNプロフィールのプライバシー設定が公開に設定されています。",
      "button": "このIDで登録を確認"
    },
    "step_2": {
      "name": "あなたのメールアドレスを確認",
      "title": "電子メールを設定",
      "send_code": "確認コードを送信",
      "description": "確認コードは次のステップで使用されます",
      "text_1": "メールは確認コード、パスワードの回復などの重要な操作に使用されます。",
      "text_2": "スパムメールを送信することはありませんので、仮のメールアドレスでの登録は避けてください。",
      "text_3": "確認コードの送信には少し時間がかかる場合がありますので、30秒待ってください。",
      "text_4": "受信しない場合は、迷惑メールフォルダーを確認するか、別のメールアドレスを試してください。",
      "text_5": "確認コードが取得できない場合は、Aboutページで管理グループのメールを通じてフィードバックしてください。",
      "button": "確認コードを受け取りました"
    },
    "step_3": {
      "name": "ログインパスワードを設定",
      "password": {
        "requre_1": "1つの文字を含む",
        "requre_2": "1つの数字を含む",
        "requre_3": "最小8文字"
      },
      "button": "次のステップ"
    },
    "step_4": {
      "name": "アカウントを確認",
      "title": "最後のステップ、アカウントを確認",
      "id": "あなたのPSN ID: {psnid}",
      "email": "あなたのPSRayアカウントメール: {email}",
      "heading": "あなたのメールで受け取った確認コードをPSNプロフィールの自己紹介に記入してください。",
      "text_1": "playstation.comにログインして、プロフィール設定を開いてください。",
      "text_2": "受け取った確認コード（6桁）を自己紹介（About）の最初に記入してください。",
      "text_3": "変更後、効果が出るまで少し待つ必要があります。",
      "text_4": "確認が完了したら、確認コードを削除できます。",
      "verification_error": "確認エラー",
      "button": "アカウントを確認"
    },
    "step_5": {
      "name": "PSRayへようこそ",
      "title": "素晴らしい！あなたはやりました〜",
      "text": "ご登録いただきありがとうございます、ようこそお越しくださいました！",
      "button": "ログインページに進む"
    },
    "back_button": "戻る"
  },
  // エラーメッセージ
  error: {
    "unknow": "エラーが発生しました。管理者にフィードバックしてください。",
  },
};
