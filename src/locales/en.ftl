# ============================================================
# ua-anti-spam-bot — English (en) locale
# ============================================================

# ------------------------------------------------------------
# Shared atoms
# ------------------------------------------------------------

delete-user-atom-with-user = ❗️ <a href="tg://user?id={ $userId }">{ $writeUsername }</a>, <b>message deleted</b>.
delete-user-atom-no-user = ❗️ <b>Message deleted</b>.

# ------------------------------------------------------------
# Admin notification
# ------------------------------------------------------------

check-admin-notification = ❗WARNING! UA Anti Spam Bot checks administrators' messages. This option can be disabled in settings.

# ------------------------------------------------------------
# Settings messages
# ------------------------------------------------------------

settings-link-to-web-view = ⚙️Open settings:

settings-has-no-linked-chats =
    ⛔️ You have no linked chats.
    
    Please join a group and press /settings.
    
settings-is-not-admin = 😔 You are not a chat administrator!

# ------------------------------------------------------------
# Swindlers messages
# ------------------------------------------------------------

swindlers-update-start = Starting update of the scammers list...
swindlers-update-end = Scammers list update complete.

swindlers-warning =
    <b>❗WARNING! UA Anti Spam Bot 🇺🇦 detected a message from scammers in this chat!</b>
    
    Be careful and follow information security rules:
    
    🔶 Do not follow suspicious links from chats!
    🔶 Avoid registrations and sharing personal data with unverified third-party resources.
    🔶 Never enter your payment card security details (CVV code and PIN).
    
    If you have become a victim of scammers or your account was hacked, contact the free digital security hotline.
    
    Get expert consultation:
    👉 @nadiyno_bot
    
    More info with /hotline_security command
    
swindlers-help =
    <b>NADIYNO: digital security hotline</b>
    
    * Received a suspicious call supposedly from a bank?
    * Shopping online but unsure about the site's safety?
    * Your account was hacked?
    
    Describe your problem and get expert consultation.
    It's free and confidential.
    
    Ask an expert!
    👉 @nadiyno_bot
    
    More about the platform:
    💻 https://nadiyno.org/
    
# ------------------------------------------------------------
# Generic bot status / commands
# ------------------------------------------------------------

status-online = 🟢 Online
status-offline = 🔴 Offline
status-updated-at = { $status }, updated at { $time }

command-start-description = 🇺🇦 Get started
command-help-description = 🙋🏻 Get help
command-settings-description = ⚙️ Settings
command-hotline-description = 🚓 Digital security hotline

# ------------------------------------------------------------
# Generic bot ready/admin messages
# ------------------------------------------------------------

bot-admin-ready =
    😎 <b>I am now an administrator.</b> Ready to work.
    ⚙️ All bot settings are available via the <b>/settings@{ $botName }</b> command
    
    👩‍💻 If the bot is not working or you have questions and suggestions, write to <a href="{ $helpChat }">the support chat</a>.
    
bot-admin-ready-no-delete = 😢 I am now an administrator. But I don't have permission to delete messages.
bot-admin-active = ✅ I am activated and doing my job.
bot-member-inactive = 😴 I am now deactivated. Resting...
bot-make-admin =
    ⛔️ I am not activated!
    <b>☝️Make me an administrator so I can delete messages and everything else I can do, at your request.</b>
bot-has-delete-permission = ✅ I have permission to delete messages.
bot-no-delete-permission = ⛔ I don't have permission to delete messages.
bot-feature-no-admin =
    ⛔️ I am not activated!
    <b>☝️Make me an administrator so I can provide this functionality.</b>
    
# ------------------------------------------------------------
# Air raid alarm messages
# ------------------------------------------------------------

alarm-chat-muted =
    🤫 The ability to send messages during an air raid alert is temporarily blocked!
    
alarm-chat-unmuted =
    💬 Message blocking has been lifted. Enjoy chatting!
    
alarm-start-1 = <b>Do NOT ignore</b> the air raid alert.
alarm-start-2 = Leave the streets and go to a shelter!
alarm-start-3 = Go to a shelter!
alarm-start-4 = Stay safe!
alarm-start-5 = Stay in shelters.
alarm-start-6 = Do not ignore air raid alert signals!
alarm-start-7 = Do not ignore the alert!
alarm-start-8 = Stay in shelters until the air raid alert is over!

alarm-end-1 = Stay safe
alarm-end-2 = Take care of yourself
alarm-end-3 = Thank you to the air defense forces!
alarm-end-4 = Glory to the Armed Forces of Ukraine!
alarm-end-5 = Peaceful skies to everyone
alarm-end-6 = Thank you to the air defense for their work!

alarm-end-night-1 = Goodnight everyone!
alarm-end-night-2 = Good evening and goodnight everyone!
alarm-end-day-1 = Have a great day! ☀️

alarm-start-notification = 🔴 <b> { $time } { $repeated ->
    [yes] Repeated air raid
    *[no] Air raid
} alert in { $state }!</b>
{ $text }

alarm-end-notification = 🟢 <b>{ $time } Air raid alert over in { $state }!</b>
{ $text }

# ------------------------------------------------------------
# Air raid alarm settings
# ------------------------------------------------------------

alarm-settings-title = <b>🤖 Air raid alert settings for the current chat.</b>
alarm-settings-description = Here you can change the region this chat belongs to.
alarm-settings-state-set = ✅ { $state } - your selected region.
alarm-settings-state-not-set = ⛔️ You haven't selected your region yet.
alarm-settings-change-hint = To change settings, press the corresponding button below. 👇

pagination-next-page = Next page ⏩
pagination-previous-page = ⏪ Previous page

# ------------------------------------------------------------
# Spam / strategic delete message
# ------------------------------------------------------------

delete-strategic-reason = spreading potentially strategic information
delete-strategic-reason-location = spreading potentially strategic information with a location message

delete-strategic-message =
    🇺🇦 <b>Reason</b>: { $reason }{ $wordMessage }.
    
    ✊🏻 «<b>єВорог</b>» — a new bot from the Ministry of Digital Transformation that occupiers cannot use.
    Report this information to it.
    
    👉🏻 @evorog_bot
    
# ------------------------------------------------------------
# Feature delete messages
# ------------------------------------------------------------

delete-feature-message = 🤫 Sending messages with <b>{ $featuresString }</b> is not allowed by the rules of this chat.

delete-nsfw-message = 🔞 Images or text of an <b>explicit nature</b> and <b>adult content (18+)</b> are prohibited.

delete-counteroffensive-message = 🤫 The Ministry of Defense recommends not discussing the ZSU counteroffensive. Please avoid comments on this topic!

# Feature name labels (used in delete-feature-message)
feature-urls = 🔗 links
feature-mentions = ⚓ mentions
feature-locations = 📍 locations
feature-forwards = ↩️ forwards
feature-cards = 💳 cards
feature-channel-messages = 💬 from channels
feature-denylist = 🚫 banned words

# ------------------------------------------------------------
# Cannot delete message
# ------------------------------------------------------------

cannot-delete-message =
    <b>😢 I cannot delete this message.</b>
    I don't have delete permissions or Telegram experienced an error.
    
    🧐 Check permissions or make me an administrator again.
    { $adminsString ->
        [none] The chat creator can help with this
        *[other] Can be helped by: { $adminsString }
    }
    
# ------------------------------------------------------------
# Statistics messages
# ------------------------------------------------------------

statistics-chat-header = <b>Total count: </b>
statistics-chats-count = • Chats - { $count } 🎉
statistics-users-count = • Users - { $count } 🎉
statistics-groups-header = <b>Group statistics</b>
statistics-super-groups = 👨‍👩‍👧‍👦 Supergroup chats: <b>{ $count }</b>
statistics-groups = 👩‍👦 Group chats: <b>{ $count }</b>
statistics-admin-active = ✅ Active admin: in <b>{ $count }</b> groups
statistics-admin-disabled = ⛔️ Disabled admin: in <b>{ $count }</b> groups
statistics-bot-removed = 😢 Bot was removed: from <b>{ $count }</b> groups
statistics-other-header = <b>Other statistics</b>
statistics-private = 💁‍♂️ Private chats: <b>{ $count }</b>
statistics-channels = 🔔 Channels: <b>{ $count }</b>

features-statistics-header = <b>Feature statistics from { $chatsCount } chats</b>
features-statistics-disabled-header = <b>🔴 Disabled default functionality:</b>
features-statistics-enabled-header = <b>🟢 Enabled optional functionality:</b>

feature-stat-strategic = 🚀 Bot deletes strategic information: <b>{ $count } ({ $percent }%)</b>
feature-stat-delete-message = ❗ Bot notifies about the reason for deleting a message: <b>{ $count } ({ $percent }%)</b>
feature-stat-swindler = 💰 Bot deletes scammer messages: <b>{ $count } ({ $percent }%)</b>
feature-stat-service-messages = ✋ Bot deletes join and farewell messages: <b>{ $count } ({ $percent }%)</b>
feature-stat-nsfw = 🔞 Bot deletes explicit content and adult content: <b>{ $count } ({ $percent }%)</b>
feature-stat-antisemitism = 🚫 Bot deletes antisemitic content: <b>{ $count } ({ $percent }%)</b>
feature-stat-alarm-mute = 🤫 Bot mutes chat during air raid alert: <b>{ $count } ({ $percent }%)</b>
feature-stat-cards = 💳 Bot deletes messages with cards: <b>{ $count } ({ $percent }%)</b>
feature-stat-urls = 🔗 Bot deletes messages with links: <b>{ $count } ({ $percent }%)</b>
feature-stat-locations = 📍 Bot deletes messages with locations: <b>{ $count } ({ $percent }%)</b>
feature-stat-mentions = ⚓ Bot deletes messages with @ mentions: <b>{ $count } ({ $percent }%)</b>
feature-stat-forwards = ↩️ Bot deletes forwarded messages: <b>{ $count } ({ $percent }%)</b>
feature-stat-channel-messages = 💬 Bot deletes messages from other Telegram channels: <b>{ $count } ({ $percent }%)</b>
feature-stat-counteroffensive = 🏃 Bot deletes counteroffensive messages: <b>{ $count } ({ $percent }%)</b>
feature-stat-delete-russian = 🪆 Bot deletes messages in Russian: <b>{ $count } ({ $percent }%)</b>
feature-stat-warn-russian = ☢ Bot warns about Russian language ban: <b>{ $count } ({ $percent }%)</b>
feature-stat-alarm-notify = 📢 Bot notifies about start and end of air raid alerts: <b>{ $count } ({ $percent }%)</b>
feature-stat-delete-obscene = 🤬 Bot deletes messages with profanity: <b>{ $count } ({ $percent }%)</b>
feature-stat-warn-obscene = ⚠ Bot warns about profanity ban: <b>{ $count } ({ $percent }%)</b>

no-new-statistic = No new records.

# ------------------------------------------------------------
# Help message
# ------------------------------------------------------------

help-if-wrong-delete = <b>If a message was deleted by mistake:</b>

help-if-wrong-delete-option-1 = • Ask administrators to write it themselves;
help-if-wrong-delete-option-2 = • Send it as a screenshot.

help-last-update = <b>Last bot update:</b>

help-support-chat = If you have questions, write to <a href="{ $helpChat }">the support chat</a>.

help-hotline-header = <b>Help hotline:</b>

help-hotline-text =
    If you have become a victim of scammers or your account was hacked, contact the free digital security hotline.
    
    Get expert consultation:
    👉 @nadiyno_bot
    
    More info with /hotline_security command
    
help-bot-version = <b>Bot version:</b> { $version }

# ------------------------------------------------------------
# Start message
# ------------------------------------------------------------

start-message-atom =
    Hi! 🇺🇦✌️
    <b>UA Anti Spam Bot 🇺🇦</b> is a free tool that simplifies the administration of Telegram channels and groups during the full-scale war.
    
    <b>UA Anti Spam Bot features enabled by default:</b>
    - 🚀 We fight harmful comments that threaten the health of our citizens and military: ZSU movements, strike locations, checkpoints, and more.
    - 💰 Protection from phishing and scammers. We block scam comments, fundraisers, and fake assistance from organizations.
    - 🔞 No pornography. We block comments of explicit nature and adult content (18+).
    - ✋ Automatic deletion of join and farewell messages to preserve the privacy of your business discussions.
    
    <b>UA Anti Spam Bot optional features:</b>
    - 📢 Notifications in chat about the start and end of air raid alerts in your region.
    - 🤫 Muting chat during an air raid alert.
    - 💳 Blocking comments with bank card fundraisers.
    - ↩️ Blocking forwarded messages or comments with @ mentions.
    - 🔗 Blocking comments if they contain any links.
    - 💬 Blocking comments if they are sent on behalf of a Telegram channel.
    - 📍 We don't reveal locations. We block comments with any locations.
    - ☢️ Warning about the use of Russian as the occupier's language in a user's comment along with motivation to switch to Ukrainian.
    - 🪆 Blocking comments written in Russian as the occupier's language, along with motivation to switch to Ukrainian.
    
start-private-instructions =
    <b>To make the bot work in a chat:</b>
    
    1) Add the bot to a chat
    2) Make the bot an administrator.
    
    Bot developer — @dimkasmile supported by IT company Master of Code Global.
    If the bot is not working, write to <a href="{ $helpChat }">the support chat</a>.
    
    Watch the instruction video below:
    https://youtu.be/RX0cZYf1Lm4
    
start-group-admins-help = This can be helped by: { $adminsString }
start-group-creator-help = The chat creator can help with this

start-channel-message =
    Hi! Message from official chatbot @{ $botName }.
    You added me to a <b>channel</b> as an administrator, but I cannot check messages in the comments.
    
    Remove me and add me to the <b>channel chat</b> as an <b>administrator</b>.
    If you have questions, write to <a href="{ $helpChat }">the support chat</a>
    
# ------------------------------------------------------------
# Updates / mass sending
# ------------------------------------------------------------

updates-prompt = Write after this message what you want to send to all active sessions:
updates-confirmation = Here's what will be sent to chats:
updates-total-chats = Total chats: { $count }
updates-button-approve = Confirm ✅
updates-button-cancel = Cancel ⛔️
updates-cancelled = Mailing was cancelled!
updates-progress = Processed { $finished }/{ $total } messages for { $type }...
updates-progress-success = Successful { $success } messages.
updates-done = Mailing complete!
updates-done-count = Sent { $success }/{ $total } messages.
updates-declined = Sorry, you don't have permission for this command.😞

# ------------------------------------------------------------
# Save to sheet (swindlers training)
# ------------------------------------------------------------

save-to-sheet-add = ✅ Add to database
save-to-sheet-not-spam = ⛔️ Not spam
save-to-sheet-error = Very bad error, check the sheet urgently!

# ------------------------------------------------------------
# Creator commands
# ------------------------------------------------------------

creator-bot-disabled = ⛔️ I am disabled globally
creator-bot-enabled = ✅ I am enabled globally

# Logs chat setup
logs-chat-description = Forum group where we collect logs from all chats.

# ------------------------------------------------------------
# Tensor training menu
# ------------------------------------------------------------

tensor-is-spam = ✅ This is spam ({ $count })
tensor-is-not-spam = ⛔️ This is not spam ({ $count })
tensor-skip = ⏭ Skip ({ $count })

tensor-waiting-more = Waiting for more ratings...
tensor-waiting-seconds = Waiting { $seconds } sec...

tensor-voted-as-spam = ✅ spam
tensor-voted-as-not-spam = ⛔️ not spam
tensor-voted-as-skip = ⏭ skip
tensor-voted-result = { $users } marked this as { $vote }
tensor-auto-delete = Will delete both messages automatically in { $seconds } sec...

tensor-private-not-supported = I don't work in private chats 😝
tensor-wrong-chat = I only work in one supergroup 😝

# ------------------------------------------------------------
# Tensor test result
# ------------------------------------------------------------

tensor-test-spam-chance = 🎲 Spam chance - <b>{ $chance }</b>
tensor-test-verdict-spam = 🤔 I think...<b>✅ This is spam</b>
tensor-test-verdict-not-spam = 🤔 I think...<b>⛔️ This is not spam</b>

# ------------------------------------------------------------
# Russian language warn/delete messages
# ------------------------------------------------------------

russian-extra-letters = The Ukrainian language does not have the letters ъ, ы, э, and ё 🇺🇦

# ------------------------------------------------------------
# Obscene warn messages (52 items)
# ------------------------------------------------------------

warn-obscene-1 = 🧾 Please refrain from using profanity. We hope you will be mindful in your choice of words.
warn-obscene-2 = 🧾 We draw your attention to inappropriate expressions in your message. Please be more careful in the future.
warn-obscene-3 = 🧾 Your last message contained offensive content. Please avoid such words in the future.
warn-obscene-4 = 🧾 Sorry, but the use of profanity does not comply with the chat rules. Please be more polite.
warn-obscene-5 = 🧾 Important message: pay attention to the content of your message and avoid incorrect words.
warn-obscene-6 = 🧾 Your message contained words that may offend other participants. Remember about cultural communication.
warn-obscene-7 = 🧾 Please do not use offensive expressions in the chat. We value a positive atmosphere among participants.
warn-obscene-8 = 🧾 According to the rules, inappropriate language is not allowed in the chat. Be careful with your words.
warn-obscene-9 = 🧾 You used words that may cause offense to others. Please be more careful in the future.
warn-obscene-10 = 🧾 We ask you to refrain from using profanity and offensive words. Thank you for your understanding.
warn-obscene-11 = 🧾 Hello! We would like to remind you that the use of profanity does not meet the standards of this chat. Please refrain from such words. Thank you for your understanding! 🙏
warn-obscene-12 = 🧾 Important note! We monitor the chat content and would like to point out that some words in your last message may offend other users. Please be more careful in choosing words. Thank you! 🌟
warn-obscene-13 = 🧾 Good day! We draw your attention to the fact that using profanity leads to a negative atmosphere in the chat. We would greatly appreciate it if you refrain from such words in the future. Thank you for your cooperation! 🚯
warn-obscene-14 = 🧾 Your attention, please! Your previous message contained some incorrect expressions. We urge you to be mindful in your choice of words so that communication remains pleasant for all participants. Thank you! 🤝
warn-obscene-15 = 🧾 Hi! We would like to warn you that the use of offensive words is not appropriate in this chat. Please follow the rules of polite communication. Thank you for your understanding! 🙅‍♂️
warn-obscene-16 = 🧾 Important information! Your recent message contained some unacceptable words. We warn you to avoid using such language in the future. Thank you for your cooperation! 🗒️
warn-obscene-17 = 🧾 Good day! We would like to remind you that the use of profanity can affect the general tone of communication. We hope for your attentiveness and adherence to cultural communication. Thank you! 🌷
warn-obscene-18 = 🧾 We draw your attention to the fact that offensive words can create tension in the chat. We ask you to be tolerant and choose appropriate language. Thank you for your understanding! 🚮
warn-obscene-19 = 🧾 Your message was flagged for using profanity. We urge you to choose more polite words to maintain a positive atmosphere in the chat. Thank you for your cooperation! 🌈
warn-obscene-20 = 🧾 Please remember the chat rules and avoid using profanity. Thank you for your understanding! 😊
warn-obscene-21 = 🧾 Important message: it's important for us to maintain a pleasant atmosphere in the chat. Please refrain from offensive words. 👍
warn-obscene-22 = 🧾 According to chat communication standards, please avoid using profanity and indecent expressions. Thank you! 🌻
warn-obscene-23 = 🧾 Your words can affect the general tone of communication. Please maintain a positive atmosphere by avoiding unacceptable expressions. 🌈
warn-obscene-24 = 🧾 We value cultural communication. Please be more careful with your choice of words to avoid offense and negativity. 🙏
warn-obscene-25 = 🧾 Please do not use swear words and profanity in the chat. We strive for positive and polite interaction. 🌟
warn-obscene-26 = 🧾 We draw your attention to the importance of maintaining dignity in communication. Please avoid profanity and offensive content. 🌷
warn-obscene-27 = 🧾 We appreciate your activity in the chat! Remember that using offensive words can negatively affect other participants. Thank you for your understanding. 🤗
warn-obscene-28 = 🧾 We would like to remind you that using indecent words does not correspond to our goal of creating a positive community. Be tolerant and polite. 🚯
warn-obscene-29 = 🧾 According to chat policy, it's important for us to maintain an appropriate atmosphere. Please refrain from unacceptable words in communication. Thank you! 🌞
warn-obscene-30 = 🧾 Let's respect other chat participants and avoid using profanity. Let's create a pleasant atmosphere together! 🌼
warn-obscene-31 = 🧾 According to the rules, we ask you to avoid offensive words and expressions. Thank you for your understanding and cooperation! 👏
warn-obscene-32 = 🧾 Please pay attention to the importance of following chat norms. Please avoid profanity in messages. 🚫
warn-obscene-33 = 🧾 Your communication is important to us! You are asked to avoid using words that may offend other participants. Thank you for your understanding! 😇
warn-obscene-34 = 🧾 It's always pleasant to communicate in a polite atmosphere. Be careful with words and avoid profanity. 🌸
warn-obscene-35 = 🧾 Dear chat participants, remember that words have power. Please choose words that promote positive communication. 🌞
warn-obscene-36 = 🧾 Let's remember that cultural communication is important for maintaining harmony in the chat. Be mindful of your expressions. 👍
warn-obscene-37 = 🧾 Excessive swearing accompanied by profanity is not an acceptable form of interaction. We encourage polite communication. 🤝
warn-obscene-38 = 🧾 Friendly reminder: please avoid profane words and insults. Together we can make the chat more pleasant for everyone. 🌷
warn-obscene-39 = 🧾 Dear participants, let's adhere to high standards of communication. Let's choose polite words and avoid indecent expressions. 🌟
warn-obscene-40 = 🧾 "Words are a weapon in the hands of the wise, and profanity marks a low spiritual level." - we emphasize the choice of expressions.
warn-obscene-41 = 🧾 "It's a sin to speak with words that aren't necessary." - we warn about the possible consequences of inappropriate language.
warn-obscene-42 = 🧾 "Don't be proud of swearing, weak language. Let better words mark your soul." - we inspire you to choose worthy words.
warn-obscene-43 = 🧾 "A confused word, like a rude image, can destroy friendship like fire destroys a beautiful house." - we warn about the danger of insults.
warn-obscene-44 = 🧾 "The word is like an archer whose arrow is evil. Let's be wiser, more careful in choosing a word." - we emphasize prudence.
warn-obscene-45 = 🧾 "Swearing won't save from problems and troubles. And refined words are a true hero in communication." - we advise choosing the language of wisdom.
warn-obscene-46 = 🧾 "The word has wings, but a rude word creates a wound that takes a long time to heal." - we warn about the impact of words.
warn-obscene-47 = 🧾 "Rude, dry words wound. And with pure language we will be beautiful." - we emphasize the importance of ethics in speech.
warn-obscene-48 = 🧾 "A wise word instead of a rude word warms like the sun, but doesn't burn." - we encourage wise choice of words.
warn-obscene-49 = 🧾 "Offensive words are poor archers. And well-chosen words are the magic of the soul." - we believe in the power of cultural communication.
warn-obscene-50 = 🧾 "Be silent, understanding that dirty words, like moral manure, destroy the spiritual bloom." - we teach to avoid rudeness.
warn-obscene-51 = 🧾 "Always avoid words that shame, because it's better to dress people with words than to shame them." - we invite you to choose words of wisdom.
warn-obscene-52 = 🧾 Important message! We monitor the chat content and note that some words in your last message may offend other users. Please be more careful.

# ------------------------------------------------------------
# Obscene delete messages (41 items)
# ------------------------------------------------------------

delete-obscene-1 = 🧼 Unfortunately, your message does not meet chat standards and contains inappropriate content. 🚫
delete-obscene-2 = 🧼 We are creating a positive community, so a message with profanity was deleted. 🌟
delete-obscene-3 = 🧼 Your message contained words that violate the rules of conduct in the chat. 🤐
delete-obscene-4 = 🧼 According to chat rules, we delete messages with offensive content, as in your case. 🗑️
delete-obscene-5 = 🧼 Your message contained incorrect expressions, so we were forced to delete it. 😕
delete-obscene-6 = 🧼 Violating chat norms with profanity led to the deletion of your message. 🙅‍♀️
delete-obscene-7 = 🧼 Your message was deleted for indecent content that violates our rules. 🛑
delete-obscene-8 = 🧼 We strive to ensure appropriate communication, so we were forced to delete your message. 🚯
delete-obscene-9 = 🧼 Sorry, but your message contained unacceptable words, so it was deleted. ❌
delete-obscene-10 = 🧼 Your message violated chat rules and contained incorrect content, so it was deleted. 🧹
delete-obscene-11 = 🧼 Your message contained incorrect content and was deleted to maintain the purity of the dialogue.
delete-obscene-12 = 🧼 Unfortunately, we were forced to delete your message as it does not meet standards of courtesy and respect for other users.
delete-obscene-13 = 🧼 Your message was marked as unacceptable in content, so it was removed from the chat.
delete-obscene-14 = 🧼 To maintain a positive atmosphere, it was decided to delete your message due to its profane nature.
delete-obscene-15 = 🧼 Sorry, but your message contained unacceptable expressions, so we deleted it.
delete-obscene-16 = 🧼 The message was deleted for offensive content that does not meet the norms of conduct in the chat.
delete-obscene-17 = 🧼 Your last message contained words that carry negative load, so it was deleted.
delete-obscene-18 = 🧼 According to chat rules, we do not allow the use of offensive words and profanity. Your message was deleted.
delete-obscene-19 = 🧼 Sorry for the inconvenience, but we decided to delete your message due to its unacceptable content.
delete-obscene-20 = 🧼 Your message contained words that may offend other users. We deleted it to ensure polite communication.
delete-obscene-21 = 🧼 Your message contained profanity, so we were forced to delete it.
delete-obscene-22 = 🧼 Sorry, but your message contained expressions that do not meet cultural standards. It was deleted.
delete-obscene-23 = 🧼 Your comment was deleted for its offensive nature. Please adhere to politeness in communication.
delete-obscene-24 = 🧼 Unfortunately, your message violated chat rules and was deleted to maintain an adequate atmosphere.
delete-obscene-25 = 🧼 Sorry for the inconvenience, but we deleted your message due to its unacceptable content.
delete-obscene-26 = 🧼 Your message contained profane expressions that do not meet our standards. It was deleted.
delete-obscene-27 = 🧼 The message was deleted because it contained words that may cause offense to other chat participants.
delete-obscene-28 = 🧼 We strive for communication in an atmosphere of respect and tolerance. Therefore, your message was deleted for its indecent nature.
delete-obscene-29 = 🧼 Our chat is open to everyone, and we strive for positive communication. Your message was deleted for incorrect content.
delete-obscene-30 = 🧼 Sorry for the intrusion, but we deleted your message because it contained profane words that may offend others.
delete-obscene-31 = 🧼 Your message was deleted, because as we say: "Words are like an archer, and the tongue is like a bow".
delete-obscene-32 = 🧼 Sorry, your message contained profane expressions: "A person is defined by their language".
delete-obscene-33 = 🧼 "One should not utter rude words, as wise Taras Shevchenko says. Let's support cultural communication" - therefore your message was deleted.
delete-obscene-34 = 🧼 "An offensive word is like a muddy sword". Your message contained insults, so it was deleted.
delete-obscene-35 = 🧼 As we say: "Don't say what is said badly", so your message was deleted for its unacceptable nature.
delete-obscene-36 = 🧼 "Sorry, but it's important for us to maintain cultural communication in the chat. Your message was deleted" - conveyed to you with a poem by Vasyl Symonenko.
delete-obscene-37 = 🧼 "Words, like pearls on a string, let's keep them clean". Your message contained insults, so it was deleted.
delete-obscene-38 = 🧼 "Silence has different images". Your message was deleted because it contained negative words.
delete-obscene-39 = 🧼 "Harmony must begin with words". Your message was deleted for its unacceptable nature.
delete-obscene-40 = 🧼 "In my word is will and the will of my word". Your message contained words that do not meet cultural norms, so it was deleted.
delete-obscene-41 = 🧼 Your message contained profanity. It was deleted according to chat rules.

# delete-obscene with word + atom
delete-obscene-by-word = by the word "{ $word }"
warn-obscene-by-word = by the word "{ $word }"

# ------------------------------------------------------------
# Antisemitism delete messages (49 items)
# ------------------------------------------------------------

delete-antisemitism-1 = 🕊️ Unfortunately, your message may contain offensive content that violates our principles of tolerance. Please refrain from antisemitic expressions. 🌈
delete-antisemitism-2 = 🕊️ We maintain high standards of behavior here, so be careful with content that may offend others through antisemitism. 🌟
delete-antisemitism-3 = 🕊️ Antisemitism is unacceptable in any form. Please remember our rules and refrain from offensive expressions. 🚫
delete-antisemitism-4 = 🕊️ We welcome all thoughts and ideas, but please avoid antisemitism in discussions. Together we build a community where everyone is respected. 🌍
delete-antisemitism-5 = 🕊️ Antisemitism contradicts our values. Please draw conclusions and refrain from offensive expressions. Thank you for your understanding. 🙏
delete-antisemitism-6 = 🕊️ We promote mutual understanding and respect for different cultures. Be attentive to other users and avoid antisemitism. 🤝
delete-antisemitism-7 = 🕊️ It is important to remember that our community is based on respect and tolerance. Please avoid antisemitism in your content. 🌟
delete-antisemitism-8 = 🕊️ Antisemitism has no place in our chat. Let's stay open to everyone and avoid offensive expressions. 🚫
delete-antisemitism-9 = 🕊️ We welcome diversity and different opinions, but please refrain from antisemitism in our discussions. Thank you for your understanding. 🌈
delete-antisemitism-10 = 🕊️ Our community upholds an open and respectful approach to all users. Be kind to each other and avoid antisemitism. 🌍
delete-antisemitism-11 = 🕊️ Unfortunately, your message may contain offensive content that violates our principles of tolerance. Please refrain from antisemitism. 🌈
delete-antisemitism-12 = 🕊️ We maintain high standards of behavior here, so be careful with content that may offend others through antisemitism. 🌟
delete-antisemitism-13 = 🕊️ Antisemitism is unacceptable in any form. Please remember our rules and refrain from offensive expressions. 🚫
delete-antisemitism-14 = 🕊️ We welcome all thoughts and ideas, but please avoid antisemitism in discussions. Together we build a community where everyone is respected. 🌍
delete-antisemitism-15 = 🕊️ Antisemitism contradicts our values. Please draw conclusions and refrain from offensive expressions. Thank you for your understanding. 🙏
delete-antisemitism-16 = 🕊️ We promote mutual understanding and respect for different cultures. Be attentive to other users and avoid antisemitism. 🤝
delete-antisemitism-17 = 🕊️ It is important to remember that our community is based on respect and tolerance. Please avoid antisemitism in your content. 🌟
delete-antisemitism-18 = 🕊️ Antisemitism has no place in our chat. Let's stay open to everyone and avoid offensive expressions. 🚫
delete-antisemitism-19 = 🕊️ We welcome diversity and different opinions, but please refrain from antisemitism in our discussions. Thank you for your understanding. 🌈
delete-antisemitism-20 = 🕊️ Our community upholds an open and respectful approach to all users. Be kind to each other and avoid antisemitism. 🌍
delete-antisemitism-21 = 🕊️ We strive for unity and mutual understanding. Be careful with expressions that may offend through antisemitism. 🤗
delete-antisemitism-22 = 🕊️ Antisemitism has no place in our conversations. Let's stay open to different thoughts and views. 🗣️
delete-antisemitism-23 = 🕊️ We welcome diversity and different cultures. Be careful with words that may violate our tolerance. 🌍
delete-antisemitism-24 = 🕊️ Please note that antisemitism is unacceptable in our discussions. Be polite and respect each other. 🙌
delete-antisemitism-25 = 🕊️ We welcome different opinions, but please refrain from antisemitism. Together we create a positive environment. 🌟
delete-antisemitism-26 = 🕊️ Antisemitism contradicts our mission of preserving a tolerant community. Thank you for your understanding. 🤝
delete-antisemitism-27 = 🕊️ Our community strives for respect and understanding. Be careful with expressions that may offend through antisemitism. 🌈
delete-antisemitism-28 = 🕊️ Avoid antisemitism in our conversations to ensure mutual respect and tolerance. Thank you for your cooperation. 🤗
delete-antisemitism-29 = 🕊️ It is important to avoid antisemitism in our conversations to maintain an atmosphere of respect and diversity. 🌈
delete-antisemitism-30 = 🕊️ Antisemitism contradicts our goals of creating a positive and open environment. Please be mindful of your words. 🌟
delete-antisemitism-31 = 🕊️ We encourage open discussions, but please avoid antisemitism in your expressions. Together we are stronger. 🤝
delete-antisemitism-32 = 🕊️ Antisemitism has no place in our community. Let's jointly care for an atmosphere of respect and understanding. 🌍
delete-antisemitism-33 = 🕊️ We have important principles of tolerance. Please refrain from antisemitism in communications. 🚫
delete-antisemitism-34 = 🕊️ We strive for mutual understanding and cooperation. Be conscious and avoid antisemitism. 🤗
delete-antisemitism-35 = 🕊️ We welcome all voices, but antisemitism has no place in our discussions. Together we build a better community. 🌈
delete-antisemitism-36 = 🕊️ Antisemitism contradicts our values of diversity and mutual understanding. Thank you for your respect. 🙏
delete-antisemitism-37 = 🕊️ We always welcome different viewpoints, but please refrain from antisemitism in discussions. 🗣️
delete-antisemitism-38 = 🕊️ Antisemitism negatively affects the atmosphere in our community. Be sensitive to this issue. 🌟
delete-antisemitism-39 = 🕊️ It is important to follow our rules and avoid antisemitism. We are together for mutual respect. 🤝
delete-antisemitism-40 = 🕊️ We value every user. Be careful with expressions that may offend through antisemitism. 🌈
delete-antisemitism-41 = 🕊️ Antisemitism contradicts our desire to create an open and welcoming community. Thank you for your cooperation. 🌍
delete-antisemitism-42 = 🕊️ We welcome ideas and different viewpoints, but please refrain from antisemitism in discussions. 🌟
delete-antisemitism-43 = 🕊️ Antisemitism does not reflect the spirit of our community. Let's be open and positive in communication. 🚀
delete-antisemitism-44 = 🕊️ We strive for understanding and respect. Be sensitive to the requirement to avoid antisemitism. 🤗
delete-antisemitism-45 = 🕊️ There is no place for antisemitism in our community. Let's keep the community free of insults. 🌍
delete-antisemitism-46 = 🕊️ We welcome all voices, but please leave antisemitism at the door. Together we make the community better. 🌟
delete-antisemitism-47 = 🕊️ Antisemitism contradicts our goals of creating a positive and tolerant environment. Thank you for your understanding. 🙌
delete-antisemitism-48 = 🕊️ We strive for friendly and constructive communication. Be mindful of words that may offend through antisemitism. 🌈
delete-antisemitism-49 = 🕊️ Our community upholds an open and respectful approach to all users. Be kind to each other and avoid antisemitism. 🌍

delete-antisemitism-by-word = by the word "{ $word }"

# ------------------------------------------------------------
# Denylist delete messages (8 items)
# ------------------------------------------------------------

delete-denylist-1 = 🚫 Your message was deleted because it contains words from our banned words list.🌟
delete-denylist-2 = 🚫 Unfortunately, your message violates our rules due to the use of banned words. Thank you for your understanding. 🙏
delete-denylist-3 = 🚫 The use of certain words is not allowed in our community. Please refrain from such expressions in the future. 🌍
delete-denylist-4 = 🚫 Please follow the community rules and avoid using banned words in messages. Thank you for your cooperation! 🌈
delete-denylist-5 = 🚫 The message was deleted for using words from the banned list. Please be mindful of our community rules. 🤝
delete-denylist-6 = 🚫 We value your participation, but ask you to refrain from words that fall under our list of banned expressions. Thank you for your understanding! 🌟
delete-denylist-7 = 🚫 Banned words are not allowed in our community. Please be conscious of your expressions. 🙌
delete-denylist-8 = 🚫 We strive for mutual respect and safety in communication. Please refrain from using banned words. 🙏

delete-denylist-by-word = for the word "{ $word }"

# ------------------------------------------------------------
# Language command
# ------------------------------------------------------------

language-changed = ✅ Language changed to { $language }.
language-invalid = ❌ Unsupported language. Available languages: uk, en.
language-current = 🌐 Current language: { $language }.
