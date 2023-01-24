function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

class TelegramPage {
  static async getUntilFound(...methods) {
    const maxTries = 3;

    for (let tryNumber = 0; tryNumber < maxTries; tryNumber++) {
      await sleep(300);

      const result = methods.find((method) => method());

      if (result) {
        return result();
      }

      await sleep(300);
    }

    return null;
  }

  static getPersonTitle() {
    return document.querySelector('.chat .sidebar-header.topbar div.chat-info-container > div.chat-info span.peer-title');
  }

  static findPublicLink() {
    const linkRow = document.querySelector('.sidebar-left-section-content .tgico-link .row-subtitle');

    if (!linkRow) {
      return null;
    }

    return linkRow.parentElement.querySelector('.row-title')?.innerText?.trim();
  }

  static findPrivateLink() {
    return document.querySelector('[onclick="joinchat(this)"]')?.href;
  }

  static closeChat() {
    return document.querySelector('.sidebar-close-button').click();
  }
}

(async () => {
  for (let dialog of dialogs) {
    if (dialog.private_link || dialog.public_link) {
      continue;
    }

    // Load the page
    window.location.href = dialog.href;
    // document.querySelector('.bubbles .scrollable').scroll(0, 100);

    // Await until fully loaded
    await sleep(1000);

    const personTitle = await TelegramPage.getUntilFound(TelegramPage.getPersonTitle);

    if (!personTitle) {
      throw new Error('No title found!');
    }

    // Open the chat about section
    personTitle.click();

    await sleep(1000);

    // Parse link and name
    dialog.public_link = await TelegramPage.getUntilFound(TelegramPage.findPublicLink);

    if (dialog.public_link) {
      dialog.public_name = '@' + dialog.public_link.split('/').splice(-1);
    } else {
      dialog.private_link = await TelegramPage.getUntilFound(TelegramPage.findPrivateLink);
    }

    if (!dialog.public_link && !dialog.private_link) {
      delete dialog.public_link;
      delete dialog.private_link;

      console.warn('No link for this dialog:', dialog);
    }

    TelegramPage.closeChat();
    TelegramPage.closeChat();
    TelegramPage.closeChat();
    TelegramPage.closeChat();
    TelegramPage.closeChat();

    await sleep(1000);

    console.info(dialog);
  }
})();
