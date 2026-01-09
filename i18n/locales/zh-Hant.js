export default {
  cookie: {
    banner: {
      message: '我們使用 Cookie 來改善網站體驗。繼續瀏覽即表示你同意使用 Cookie。',
      accept: '接受',
      reject: '拒絕',
      learn_more: '了解更多',
    }
  },
  legal: {
    title: '使用者協議與隱私',
    privacy: '隱私政策',
    terms: '使用者協議',
    delete: '刪除我的資料',
    privacy_desc: '了解我們如何蒐集、使用與儲存資料。',
    terms_desc: '使用者義務與可接受的使用規範。',
    delete_desc: '提交請求，永久刪除你的個人資料。'
  },
  appMenu: {
    "home": "主頁",
    "leaderboard": "排行榜",
    "trophy_set": "PSN 獎盃組",
    "game": "遊戲",
    "laboratory": "社區實驗室",
    "forum": "論壇",
    "store": "商店",
    "anti_cheating": "反作弊",
    "public_log": "公開日誌",
    "about": "關於",
  },
  userMenu: {
    login: "登入",
    register: "註冊",
    profile: "我的首頁",
    sync: "同步遊戲",
    home: "個人中心",
    settings: "帳戶設定",
    contributions: "我的貢獻",
    admin_panel: "管理員面板",
    logout: "退出登入",
  },
  // 通用
  common: {
    "login": "登入",
    "sign_up": "註冊",
    "sign_up_now": "立即註冊",
    "platinum": "白金",
    "gold": "金",
    "silver": "銀",
    "bronze": "銅",
  },
  // 使用者個人中心
  dashboard: {
    "level": "等級",
    "joined": "加入",
    "my_tips": {
      "name": "我發布的Tip",
      "release_date": "發布於",
      "helpful": " 有 {vote} 人覺得很有幫助",
      "button": "查看",
    },
    "following_users": {
      "name": "我關注的使用者",
      "following": "關注中",
      "mutual": "互相關注中",
      "button": "查看個人資料",
    },
    "my_followers": {
      "name": "我的粉絲",
      "follow_you": "關注了你",
      "mutual": "互相關注中",
      "button": "查看個人資料",
    },
    "profile_card": {
      "name": "個人資料卡片",
      "text": "製作中，敬請期待"
    }
  },
  // 帳戶設定
  setting: {
    "name": "個人設定",
    "warning_text": "個人設定頁面還在重做中，目前只有以下內容可以設定。",
    "profile": {
      "name": "個人資料頁面",
      "calendar": {
        "is_enabled": "在我的個人首頁顯示近期動態日曆",
      },
      "sync": {
        "interval": "個人資料同步間隔",
        "description": "目前每 {interval} 小時，自動和PSN同步一次您的個人資料",
        "next_update": "預計下次更新",
        "change": "更改",
        "button": "更新",
        "disabled": "已關閉自動更新",
      },
      "linked_account": {
        "name": "在個人資料頁面展示其他遊戲平台",
        "description_1": "您可以關聯一些常見的遊戲平台，讓更多人認識你",
        "description_2": "無需登入，只需填寫對應平台ID，即可在個人資料頁面生成連結",
        "description_3": "需要刪除或隱藏請留空",
        "custom_id_example": "Steam 自訂社群ID 範例",
        "steam_64bit_example": "Steam 64位ID 範例",
        "xbox_id_example": "Xbox ID 範例",
        "ns_example": "範例",
        "red_text_only": "只需要填寫紅字部分",
        "button": "更新",
      },
    },
    "password": {
      "name": "修改密碼",
      "old_pass": "舊密碼",
      "new_pass": "新密碼",
      "confirm": "重複一次",
      "condition": {
        "requre_1": "包含 1 個字母",
        "requre_2": "包含 1 個數字",
        "requre_3": "最少 8 個字元",
      },
      "button": "更新密碼",
    },
  },
  // 網站首頁
  home: {
    "breadcrumbs": "",
    "title": "歡迎來到 PSRay 遊戲社群",
    "description_1": "在這裡，記錄PSN帳戶獎盃和遊戲，交流遊戲心得，尋找攻略，交識玩家。",
    "description_2": "PSRay (Alpha) 還處於製作階段，站內大部分功能尚未完成。",
    "sync_psn_account": "同步我的 PSN 帳戶",
    "function_card": {
      "player_leaderboard": "玩家排行榜",
      "search_trophies": "尋找PSN獎盃",
      "rate_games": "為遊戲打分",
      "game_walkthroughs": "尋找攻略",
      "find_friends": "找到朋友",
      "find_answers": "求助問題",
    },
    "card_1": {
      "text_1": "3分鐘",
      "text_2": "即可建立您的 PSN 個人頁面",
    },
    "card_2": {
      "text_1": "源於玩家 服務玩家",
      "text_2": "立即成為 PSRay 社群一員",
      "logged_in_text": "歡迎回來",
      "my_ranking": "我的排名"
    },
    "recent_sync": {
      "title": "最近被同步的玩家",
      "empty": "暫無資料",
      "error": "載入失敗"
    }
  },
  // 同步頁面
  sync: {
    "title": "在 PSRay 同步 PSN 資訊",
    "sub_title": "輸入您的 PSN ID ，即可開始同步",
    "button": "更新個人資料",
    "success": {
      "title": "已添加到同步隊列",
      "text_1": "您的同步任務，已在 PSRay 後台隊列中",
      "text_2": "遊戲同步將按照隊列順序執行，這需要一點時間完成",
      "button": "前往 {psnid} 的個人主頁面",
    },
    "message": {
      "title": "在目前無法同步隱藏遊戲",
      "text_1": "你可以設置帳戶為私密，然後同步一次帳戶，這會隱藏所有遊戲",
      "text_2": "再改成公開資料後，重新同步。這會從零開始同步",
      "text_3": "今後我們會修復該問題",
    },
    "syncing_text": "正在提交您的同步請求",
  },
  // 排行榜頁面
  leaderboard: {
    "title": "PSRay 排行榜",
  },
  // 獎盃組
  trophies: {
    // 獎盃組頁面
    "version": "版本",
    "created_at": "建立時間",
    "updated_at": "最後更新",
    "tags": "獎盃組標籤",
    "game_info": "遊戲資訊",
    "view_game_details": "查看遊戲資訊",
    "related_trophy_set": "不同版本/地區",
    "player_ranking": "玩家排行",
    "first_achievers": "進度最快排行",
    "fastest_completed": "耗時最短排行",
    "contribute": {
      "title": "歡迎貢獻PSRay獎盃組資訊！",
      "text_1": "我們為參與的使用者提供了豐富的獎勵回報.",
      "text_2": "如果你了解這個遊戲，你可以:",
      "can_do_1": "關聯不同平台和地區的獎盃組",
      "can_do_2": "為獎盃組增加標籤",
      "editing_button": "編輯獎盃組"
    },
    "how_long_to_beat": {
      "title": "耗時和難度",
      "text_1": "該資料是PSRay玩家提供的平均值，僅供參考",
      "text_2": "隨著版本更新和新DLC發售，難度和時間也可能變化",
      "story_playtime": "平均通關耗時",
      "platinum_playtime": "平均白金耗時",
      "playthrough": "白金所需周目",
      "difficulty": "難度",
      "share_my_time": "分享我的用時",
      "detail_button_text": "查看詳情",
    },
    "recent_players": "最近玩過",
    "all_recent_players": "查看最近在玩的人",
    "statistics": "玩家統計",
    "played": "玩過",
    "platinum_achievers": "已白金",
    "completed_players": "100%人數",
    "average_progress": "平均進度",
    "player_trophy_status": "玩家遊戲進度",
    "first_trophy": "第一個獎盃",
    "last_trophy": "最後一個獎盃",
    "duration": "耗時",
    "earned_trophies": "已獲得的獎盃",
    "unearned_trophies": "還未獲得的獎盃",
    "translations": "獎盃組翻譯",
    "sort": {
      "default": "預設",
      "date": "獲得時間",
      "psn-rarity": "PSN 稀有度",
    },
    "filter": {
      "all": "全部",
      "earned": "已獲得",
      "unearned": "尚未獲得",
    },
    // 獎盃組首頁
    overview: {
      "title": "獎盃組",
      "search": "搜索獎盃組",
      "search_tip": "搜索詞需要2個字元以上",
      "summary": {
        "title": "概況",
        "trophy_set_count": "獎盃組數量",
        "translations": "獎盃組翻譯數",
        "trophy_count": "獎盃數",
        "game_play_count": "遊戲記錄"
      },
      "data": {
        "title": "數據",
        "platform": "平台",
        "fetched_trophy_set": "已抓取獎盃組數量",
        "language": "語言",
        "localizations": "獎盃組翻譯和本地化",
      },
      "popular": "熱門的獎盃組",
      "playing": "{headcount} 人最近在玩",
      "recent": "最近新增的獎盃組",
    },
    // 獎盃組搜索頁面
    search: {
      "title": "從資料庫搜索獎盃組",
      "button": "搜索",
      "open_search_result": "查看獎盃組",
      "help_text_1": "目前只提供簡單搜索功能",
      "help_text_2": "搜索字元最低需要2個",
      "help_text_3": "您只能透過單個關鍵來模糊搜索",
      "help_text_4": "簡體字繁體字不通用",
      "help_text_5": "過濾篩選，排序功能尚未完成",
      "help_text_6": "目前沒有任何搜索語法和權重匹配",
      "view_button": "查看獎盃組",
    },
    // 獎盃組排行頁面
    ranking: {
      "first_achievers": "最先達成排行",
      "fastest_completed": "最短耗時排行",
      "recent_players": "最近在玩",
    },
  },
  // 獎盃頁面
  trophy: {
    "tips": {
      "title": "社群Tips",
      "description_html": "分享你的 獲取過程、 經驗、 小技巧。 幫助其他玩家更容易獲得獎盃",
      "not_good_1": "評價、吐槽、提問、留念",
      "good_1": "獎盃取得方法",
      "good_2": "注意事項",
      "warning": "請勿發布與該獎盃不相關的內容。如果未遵循發布規則，相關內容將被隱藏",
      "not_posted_yet": "您還未在該獎盃下發布過內容",
      "write_new_tip_button": "發布我的Tips",
      "posted": "您已經在該獎盃下發布過內容",
      "edit_button": "編輯我的Tip",
      "delete_button": "刪除",
      "hidden_editor": "隱藏編輯器",
      "not_logged_in": "登入後，可以分享您的 Tips",
      "edit_my_tip": "編輯我的Tip",
    },
    "tip": {
      "post_date": "投稿於",
      "edited_date": "編輯於",
      "language": "寫作語言",
      "is_helpful": "你認為這個 Tip 有幫助嗎?",
      "like": "{count} 人覺得這條 Tip 有幫助",
      "dislike": "{count} 人不喜歡它",
      "mark": {
        "name": "使用者標記",
        "spoiler": "Tip內容含有劇透",
        "missbale": "該獎盃可錯過",
        "unmissable": "該獎不會錯過",
      }
    },
    "tip_editor": {
      "language": "標記您的Tip寫作語言",
      "missable": "標記是否會錯過",
      "spoilers": "內容有劇透",
      "post_button": "發布",
    },
    "players": {
      "back_1": "返回上一頁",
      "back_2": "返回獎盃頁面",
      "fastest": "最先取得",
      "recent": "最近取得",
    }
  },
  // 遊戲頁面
  game: {
    "upcoming": "即將發售的遊戲",
    "recently_added": "最近新增的遊戲",
    "description_1": "PSRay 是面向PSN玩家的遊戲資料庫。我們不提供任何遊戲發行，製作，下載服務。我們不售賣任何遊戲",
    "description_2": "PSRay 目前所有遊戲資料數據，來自IGDB.com ，它是一個公開的資料庫服務",
  },
  // 論壇
  forum: {
    "title": "PSRay 論壇",
    "warning_text_1": "糟糕，PSRay的論壇功能還在建設中",
    "warning_text_2": "您可以使用我們準備的臨時論壇",
    "text_1": "注意：主站的帳號和臨時論壇帳號不通用",
    "text_2": "臨時論壇目前用於bug提交和意見回饋",
    "text_3": "臨時論壇的資料，在正式論壇完成後將會被刪除",
    "text_4": "臨時論壇使用flarum開源程式搭建",
    "button": "前往臨時論壇"
  },
  // 兌換
  store: {
    "title": "歡迎來到 PSRay交換所",
    "description_1": "PSRay會對創作者和活躍使用者提供一些回報",
    "description_2": "在這裡，可以用在PSRay社群獎勵，兌換一些你需要的物品",
    "description_3": "可以兌換的物品會定期更新。相同的物品更新後會重設兌換次數",
    "balance": "我的可用於兌換的PSRay貨幣",
    "balance_text": "可以在社群實驗室，確認它們的獲取方式",
    "remaining": "剩餘",
    "require_item": "兌換需要物品",
    "capacity": "總數",
    "stock": "庫存",
    "gift_card": {
      "name": "兌換 PSN 儲值卡",
      "text_1": "可以按需求，更換為其他地區的同價值物儲值卡，或是現金獎勵",
      "text_2": "第1期兌換時間： {date}。每人最多兌換 {limit} 價值的物品",
    },
    "view": "查看詳情",
    // 兌換頁面
    "redeem": {
      "title": "兌換獎勵",
      "text_1": "所有獎勵，透明、公平發放。兌換記錄為公開，任何人可以看到您的兌換記錄",
      "text_2": "兌換後，不會扣除您個人首頁上顯示的總數，兌換部分會標記為\"已被使用\"",
      "text_3": "如何獲取獎勵：可以在社群實驗室，確認它們的獲取方式",
      "not_redeemed": "尚未兌換該物品",
      "redeemed": "已經兌換過",
      "redeemed_date": "兌換時間",
      "obtaining": "目前人工發放獎勵，請透過下面的聯絡方式獲取獎勵",
      "button": "立即兌換",
      "record": "該物品的兌換記錄",
      "redeemer": "兌換人 (PSNID)",
      "redemption_time": "兌換時間",
      "quantity": "數量",
    }
  },
  // 反作弊
  "anti_cheat": {
    "title": "反作弊",
    "pinned": "PSRay會提供作弊/修改檢測，目前相關細節還在討論徵求意見中",
    "text_1": "為保證社群排行榜的相對公平，PSRay會採用[人工+自動化]的檢測",
    "text_2": "所有人工封禁和自動化作弊檢測的警告記錄，將會會被公開，任何人都可以可以查閱",
    "ban_record": "封禁記錄查詢",
    "card_1": "移除作弊玩家數",
    "card_2": "禁止參與排名玩家數",
    "description": {
      "title": "說明",
      "text_1": "反作弊的核心目的，是保護排行榜上的核心玩家的動力。包括總排行和獎盃組排行",
      "text_2": "PSRay希望大家正常的進行遊戲。PSRay無法檢測是否使用了非正常手段，所有判斷依據是獎盃獲取時間戳，獲取順序，獲取間隔",
      "text_3": "PSRay不會管獎盃取得方式是否\"合法\"。對於不適合放入排行的紀錄，例如訪客帳號轉移獎盃等，將會被反作弊系統移除或警告",
      "text_4": "PSRay不會追究過去、且已經隱藏的紀錄。PSRay建站收集資料較晚，如果在其他網站被封禁，並且導致封禁的原因的獎盃組已經隱藏，視為沒有問題",
      "text_5": "如果利用了遊戲內的BUG觸發了反作弊，提供合理的復現方法可以進行申訴即可，管理組將會投票判斷",
    },
    "level": {
      "title": "等級劃分",
      "description": "我們將系統劃分為數個等級，對應採取的措施也會有區別",
      "table_head": "等級",
      "measures": "對應措施",
      "warning": "警告 (Warning)",
      "suspension": "暫停排名 (Suspension)",
      "ban": "禁用排名 (Ban)",
      "termination": "停用帳戶 (Termination)",
      "warning_text": "系統自動記錄，不會有任何措施。當觸發過多次數時，管理組會可能會人工排查",
      "suspension_text": "暫時隱藏排名。隱藏警告的遊戲後立即可以復原排名",
      "ban_text": "永久禁止參與排行榜。仍然可以用站內功能",
      "termination_text": "移除帳號。禁止該PSNID今後的同步，排名，禁止註冊",
    },
    "components": {
      "title": "系統組成",
      "description": "暫時決定將反作弊系統，分成3個部分執行。任何情況使用者都可以申訴",
      "text_1": "同步時自動化檢測：根據預設的規則，檢查獲取時間是否符合邏輯",
      "text_2": "社群玩家檢舉：由社群玩家檢舉。管理組會根據檢舉使用者的證據、被檢舉使用者的證據判斷，最後決定結果",
      "text_3": "管理組人工處理：由管理組直接封禁。一般針對特別明顯的作弊行為",
    },
    "auto_detection": {
      "title": "自動化檢測",
      "text_1": "開發階段中，請關注我們的公告獲取最近消息",
      "text_2": "將在使用者同步獎盃的時候，自動執行。自動化判斷規則將公開。任何人可以建立新的規則，新的規則會由社群投票通過",
      "text_3": "對於版本更新等原因，已經不適用的舊的規則，可以發起投票刪除",
    },
    "appeal": {
      "title": "申訴",
      "text_1": "暫時還沒有把申訴系統做完，如果您有任何疑問，可以聯繫管理組信箱",
    },
    // Anti Cheat Records Page
    "records": {
      "title": "反作弊系統記錄",
      "description": "搜尋特定PSNID的封禁記錄功能，將在下次更新後提供",
      "last_updated": "最後更新時間",
      "respondent": "處理物件",
      "type": {
        "name": "類型",
        "moderators_ban": "管理員人工封禁",
      },
      "cause": {
        "name": "原因",
        "cheating": "獎盃修改/作弊",
      },
      "judge": "批准管理員",
      "level": "處理等級",
      "measures": "影響",
      "explanation": "說明",
    },
  },
  // 公開日誌
  "public_log": {
    "title": "獎盃更新紀錄",
  },
  // 關於
  about: {
    "title": "關於 PSRay 遊戲社區",
    "heading": "歡迎來到 PSRay 遊戲社區，這裡是一個PSN玩家交流的平台",
    "description_1": "通過PSN帳戶管理自己的遊戲歷程，創建自己獨一無二的遊戲首頁",
    "description_2": "發現與自己風格匹配的遊戲和玩家，相信你能在這裡尋找只屬於自己的寶物",
    "description_3": "分享自己的小技巧，幫助大家一起跨越障礙前行",
    "description_4": "無論何時，你都是被需要的",
    "chat_groups": "官方交流群組",
    "teams": "PSRay 管理團隊",
    "programming": "程序",
    "moderators": "社區管理員",
    "special_thanks": "感謝以下開源項目",
    "icon_license": "圖示許可證",
  },
  // 個人頁面
  profile: {
    "registered": "註冊會員",
    "followed": "已跟隨",
    "unfollow": "取消跟隨",
    "follow_you_back": "跟隨了你",
    "sync_psn_trophies": "同步獎盃進度",
    "follow": "跟隨",
    "page_view": "頁面瀏覽量",
    "following": "正在跟隨",
    "followers": "跟隨者",
    "contribution_rewards": "社群貢獻獎勵",
    "star_piece": "星星碎片",
    "rare_candy": "神奇糖果",
    "philosophers_stone": "賢者之石",
    "mira": "米拉",
    "next_auto_update_time": "下次自動更新時間",
    "auto_update_disabled": "自動更新已被停用",
    "linked_game_account": "關聯的遊戲帳號",
    "milestones": "里程碑",
    "ranking": "排名",
    "server_location": "所在伺服器",
    "server_rannking": "伺服器排行",
    "last_update_at": "帳戶最後更新於",
    "last_trophy_earned_at": "最後獲得獎盃時間",
    "trophy": "獎盃",
    "first_trophy_earned_at": "首個獎盃",
    "psn_level": "PSN 等級",
    "earned_trophies_count": "獲得的獎盃總數",
    "game": "遊戲",
    "game_played": "玩過的遊戲",
    "completion_rate": "完美率",
    "less_than_10": "低完成度的遊戲",
    "trophy_tips": "獎盃Tips",
    "trophy_calendar": "獎盃日曆圖",
    "trophy_calendar_description": "最近一年的獎盃記錄",
    "swipe_left": "向左滑動查看全部",
    "recently_played": "近期在玩",
  },
  // 登入頁面
  login: {
    "account": "Account (PSNID)",
    "password": "Password",
    "button": "Login",
    "no_account_held": "No PSRay account yet?",
    "success": {
      "syncing_message": "Login successful, synchronizing your account information.",
      "welcome_message": "Welcome back, {psnid}. We’ll take you to your homepage in 5 seconds."
    }
  },
  // 註冊頁面
  "sign_up": {
    "step_1": {
      "name": "確認您的PSNID是否可用",
      "title": "創建 PSRay 帳號",
      "heading": "使用 PlayStation Network ID 註冊",
      "description": "目前註冊有限制，需要滿足下面條件",
      "condition_1": "PSN已經在本站同步過一次，如果沒有請先到同步頁面同步",
      "condition_2": "PSN等級已達到100級",
      "condition_3": "PSN個人資料隱私設定為公開",
      "button": "確認使用該ID註冊"
    },
    "step_2": {
      "name": "確認您的信箱",
      "title": "設置電子信箱",
      "send_code": "發送驗證碼",
      "description": "驗證碼將在下一步使用",
      "text_1": "信箱用於接收驗證碼，找回密碼等重要操作",
      "text_2": "我們不會推送垃圾郵件，請不要使用臨時信箱註冊",
      "text_3": "發送驗證碼可能需要一點時間，請等待30秒",
      "text_4": "如果沒有收到請檢查垃圾箱或換個信箱試試",
      "text_5": "無法獲得驗證碼時，可以在關於頁面，通過管理組信箱回饋",
      "button": "我已經收到驗證碼",
    },
    "step_3": {
      "name": "設置登錄密碼",
      "password": {
        "requre_1": "包含 1 個字母",
        "requre_2": "包含 1 個數字",
        "requre_3": "最少 8 個字元",
      },
      "button": "下一步"
    },
    "step_4": {
      "name": "驗證您的帳號",
      "title": "最後一步，驗證您的帳號",
      "id": "您的 PSN ID：{psnid}",
      "email": "您的 PSRay 帳戶信箱： {email}",
      "heading": "請將您信箱收到的驗證碼，填寫到您的PSN個人資料的簡介中",
      "text_1": "請在 playstation.com 登錄，打開個人資料設置",
      "text_2": "將您收到的驗證碼(6位數字)，填到自我介紹(About)的最前面",
      "text_3": "修改後，可能要等待一會才能生效",
      "text_4": "驗證完成後，您可以刪除驗證碼",
      "verification_error": "驗證出錯",
      "button": "驗證帳戶",
    },
    "step_5": {
      "name": "歡迎來到PSRay",
      "title": "好棒！你做到了~",
      "text": "感謝您的註冊，歡迎登船！",
      "button": "前往登入頁面",
    },
    "back_button": "返回",
  },
  // 錯誤資訊
  error: {
    "unknow": "發生了未知錯誤，請在論壇向管理員回饋",
  },
};
