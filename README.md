<h1 align="center">✋ Telegram Comments Antibot</h1>

<p align="center">
  <a href="https://github.com/174n/telegram-comments-antibot/commits/main"><img src="https://img.shields.io/github/last-commit/174n/telegram-comments-antibot.svg" alt="last commit"></a>
  <a href="https://github.com/174n/telegram-comments-antibot/issues"><img src="https://img.shields.io/github/issues/174n/telegram-comments-antibot.svg" alt="GitHub issues"></a>
  <img src="https://badges.pufler.dev/visits/174n/telegram-comments-antibot" alt="Visits">
  <a href="https://github.com/174n/telegram-comments-antibot/blob/main/LICENSE"><img src="https://img.shields.io/github/license/174n/telegram-comments-antibot" alt="license"></a>
</p>

This is a bot for filtering telegram comments.

## Installation

```bash
git clone https://github.com/174n/telegram-comments-antibot.git
cd telegram-comments-antibot
npm i
```

Now you need to get ```BOT_TOKEN``` from [BotFather](https://t.me/BotFather). Create ```.env``` file and put it in there like that (and also add a list of chat ids where the bot allowed to run):

```
BOT_TOKEN=<your token here>
CHAT_WHITELIST=777777777,-1000000000000
```

## Configuration

There are two kinds of reputation. There is reputation for a user sending the message, which will be saved and updated with each message. The single message also has its own reputation. If the reputation goes bellow 0, the message will be deleted. Everything is configurable in the ```.env``` file.

### USAGE EXAMPLE

```
ONLY_WORK_IN_COMMENTS=false
START_REPUTATION=999
```

**ONLY_WORK_IN_COMMENTS**
- *If true, the bot will only filter comments and will keep the group chat untouched*
- Default: ```true```

**DISABLE_USER_REP**
- *If true, the bot will not take user's reputation into account (it will still be recorded though)*
- Default: ```false```

**START_REPUTATION**
- *The start reputation of a user*
- Default: ```1000```

**CHANNEL_START_REPUTATION**
- *The start reputation of a channel*
- Default: ```100```

**EMOJI_REPUTATION**
- *How many reputation will be added for each emoji in the message*
- Default: ```-10```

**FORMATTINGS_REPUTATION**
- *How many reputation will be added for each formatting block in the message*
- Default: ```-10```

**URLS_REPUTATION**
- *How many reputation will be added for each url in the message*
- Default: ```-10```

**NEW_MESSAGE_REPUTATION**
- *How many reputation will be added for each new message user sends*
- Default: ```5```

**START_MSG_REPUTATION**
- *Start reputation of a single message*
- Default: ```100```

**FORMATTINGS_MSG_REPUTATION**
- *How many reputation will be added for each formatting block in the message*
- Default: ```-5```

**EMOJI_MSG_REPUTATION**
- *How many reputation will be added for each emoji in the message*
- Default: ```-5```

**URLS_MSG_REPUTATION**
- *How many reputation will be added for each url in the message*
- Default: ```-80```

**CHANNEL_MSG_REPUTATION**
- *How many reputation will be added to the message if the person sending it is a channel*
- Default: ```-100```
