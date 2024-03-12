<h1 align="center">UA Anti Spam Bot 🇺🇦</h1>

<p align="center">
  <a href="https://github.com/MoC-OSS/ua-anti-spam-bot/commits/develop"><img src="https://img.shields.io/github/last-commit/MoC-OSS/ua-anti-spam-bot.svg" alt="last commit"></a>
</p>

**UA Anti Spam Bot 🇺🇦** is a Node.js bot designed to detect and block spam messages on Ukrainian language groups and channels in Telegram. The bot is built on machine learning algorithms, natural language processing techniques, and basic algorithms which allow it to effectively detect and filter out unwanted messages.

**We use grammY**

grammY is a powerful and user-friendly framework for building Telegram bots using Node.js. It provides a simple yet robust API for interacting with the Telegram Bot API and handling user messages, inline queries, and other events. With Grammy.js, you can quickly build complex bots with ease.

The framework comes with comprehensive documentation available at https://grammy.dev, which covers everything from getting started with installing and configuring the framework to more advanced topics like handling bot commands, keyboard interactions, and file uploads. The documentation is easy to follow and provides plenty of examples to help you get started with building your own Telegram bot.

## Table of Content

- [Before you start](#before-you-start)
  - [1. Files](#1-files)
  - [2. GitHub Access](#2-github-access)
- [Installation](#installation)
  - [1. Cloning](#1-cloning)
  - [2. Installing `Node.js`](#2-installing-nodejs)
    - [NVM (recommended)](#nvm-recommended)
    - [Node](#node)
  - [3. Installing Redis](#3-installing-redis)
    - [Docker-compose (recommended)](#docker-compose-recommended)
    - [Install in System](#install-in-system)
  - [4. Installing `node_modules`](#4-installing-node_modules)
  - [5. Copy `.env` file](#5-copy-env-file)
  - [6. Create your bot](#6-create-your-bot)
  - [7. Set your Telegram ID](#7-set-your-telegram-id)
  - [8. Set local testing `.env` variables](#8-set-local-testing-env-variables)
  - [9. Set Google Credits (confidential)](#9-set-google-credits-confidential)
  - [10. Set Alarm Credits (confidential)](#10-set-alarm-credits-confidential)
  - [11. Copy tensor files](#11-copy-tensor-files)
- [Running your bot](#running-your-bot)
  - [Enable bot in `Telegram`](#enable-bot-in-telegram)
  - [Docker](#docker)
- [Code Style](#code-style)
  - [Branch names](#branch-names)
  - [Commit names](#commit-names)
  - [Code Rules](#code-rules)
  - [IDE Setup](#ide-setup)
- [Credits](#credits)

## Before you start

If you from [Master of Code Global](https://masterofcode.com/) (MOC), PM me for next things:

### 1. Files

```
ua-anti-spam-bot-ml-v3.zip
.env.new
``` 

### 2. Github Access

You need to be added into `UA Anti Spam Bot Developers` team.

## Installation

### 1. Cloning

```bash
git clone git@github.com:MoC-OSS/ua-anti-spam-bot.git
cd ua-anti-spam-bot
```

### 2. Installing `Node.js`

#### NVM (recommended)

If you have Linux or MacOS, it's better to use [nvm](https://github.com/nvm-sh/nvm). We have `.nvmrc` file which includes the current version of node that we use on the project. Just run the following command at the root of the folder:

```bash
nvm use
```

#### Node

If you have Windows or want to install Node into the system, find the download Node.js version specified in `.nvmrc`. 

### 3. Installing Redis

#### Docker-compose (recommended)

If you have `docker` and `docker-compose`, just run the following command:

```bash
docker-compose up -d redis
```

#### Install in System

If you don't want to use `docker-compose`, you can [install redis in system](https://redis.io/).

### 4. Installing `node_modules`

```bash
npm i
```

### 5. Copy `.env` file

Copy `.env.template` file to `.env`:

```bash
cp .env.template .env
```

### 6. Create your bot

Now you need to get `BOT_TOKEN` from [@BotFather](https://t.me/BotFather). You may find instruction here: https://core.telegram.org/bots/tutorial#obtain-your-bot-token

Set it into `.env` file:

```bash
BOT_TOKEN=4839574812:AAFD39kkdpWt3ywyRZergyOLMaJhac60qc
```

### 7. Set your Telegram ID

You can ask [@RawDataBot](https://t.me/RawDataBot) to get your ID. Simply write `/start` and find `message.from.id`. E.g, it will be `999999999`.

Set it into `.env` file:

```bash
CREATOR_ID=999999999
```

### 8. Set local testing `.env` variables

We recommend to set the following variables in your .env file like this:

```bash
ENV=local
USE_SERVER=false
DISABLE_LOGS_CHAT=true
```

### 9. Set Google Credits (confidential)

You need to obtain your own credits (or ask me if you from MOC team) and set them here:

```
GOOGLE_CREDITS=
GOOGLE_SPREADSHEET_ID=
```

### 10. Set Alarm Credits (confidential)

We use https://alerts.com.ua/ to obtain air raid alarms. You need to ask for a key from the API developer (or me if you from MOC).

```
ALARM_KEY=
```

### 11. Copy tensor files

Extract and copy `ua-anti-spam-bot-ml-v3.zip` to `src/tensor/temp`.

## Running your bot

To start your bot, simply run the following command:

```bash
npm run start:bot
```

### Enable bot in `Telegram`

After it, navigate to your bot and call `/start` command. If you receive the answer, your bot is working.

Then, try to call `/enable` command. If you receive the answer, your bot is set correctly and ready to be used.

### Docker
If you want to run the bot via Docker, make sure that you have [Docker](https://docs.docker.com/engine/install) and [Docker Compose](https://docs.docker.com/compose/install) installed.
Then, run the following command to start the bot in Docker:

```bash
docker-compose up --build
```

## Code Style

### Branch names

We use `branch-name-lint`.
To push a branch, be sure you have right prefix, ticket name in uppercase, and description split by underscore. Example branch name:

  * feature/UABOT-8_create_lp_ui_elements
  * hotfix/UABOT-11_add_missing_login_routes

Read more: https://github.com/barzik/branch-name-lint

### Commit names

We use Conversational Commits Conversational with `commitlint`.
To make a commit, be sure you follow it. Example:

* feat(UABOT-20): add the users page
* refactor(UABOT-10): refactor tests

Read more: https://www.conventionalcommits.org

### Code Rules

We have a pretty heavy `eslint` and `prettier` setup, so you don't need to be worried about code style. Tools will make everything for you.

### IDE Setup

Don't forget to setup your IDE:

1) **WebStorm:** Enable `eslint` plugin in this repo;
2) **VSCode:** Download and enable `eslint` plugin in this repo.

## Credits

Made with ❤️ to save Ukraine 🇺🇦 2023
