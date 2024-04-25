const { driver } = require('@rocket.chat/sdk');
const he = require('he');

/**
 * Send appropriate message according to message type received from Botpress
**/
async function sendMessage(response, roomId) {
  if (response.type === 'text') {
    // Simple text message
    return await sendTextMessage(response, roomId);
  }else if (response.type === 'image') {
    return await sendImageMessage(response, roomId);
  }else if (response.type === 'single-choice') {
    return await sendSingleChoiceMessage(response, roomId);
  }else if (response.type === 'file') {
    return await sendFileMessage(response, roomId);
  }else if (response.type === 'video') {
    return await sendVideoMessage(response, roomId);
  } else if (response.type === 'carousel') {
    // Carousel message
    return await sendCarouselMessage(response, roomId);
  } else if (response.type === 'custom') {
    if (response.component === 'QuickReplies') {
      // Quick replies message
      return await sendQuickRepliesMessage(response, roomId);
    } else if (response.component === 'Dropdown') {
      // Dropdown message
      return await sendDropdownMessage(response, roomId);
    } 
  }
}

async function sendTextMessage(response, roomId) {
  const msg = await driver.prepareMessage(he.decode(response.text), roomId);

  return await driver.sendMessage(msg);
}

async function sendImageMessage(response, roomId) {
  const msg = await driver.prepareMessage(he.decode(''), roomId);
  let imageUrl = response.image;

  if (config.ENVIROMENT == "dev") {
    imageUrl = createUrlForEmulator(imageUrl);
  }

  const attachment = {title: response.title, image_url: imageUrl};
  msg.attachments = [attachment];

  return await driver.sendMessage(msg);
}

async function sendFileMessage(response, roomId) {
  const msg = await driver.prepareMessage(he.decode(''), roomId);
  let fileUrl = response.file;

  if (config.ENVIROMENT == "dev") {
    fileUrl = createUrlForEmulator(fileUrl);
  }
  
  const attachment = {title: response.title, title_link: fileUrl};
  msg.attachments = [attachment];

  return await driver.sendMessage(msg);
}

async function sendVideoMessage(response, roomId) {
  const msg = await driver.prepareMessage(he.decode(''), roomId);
  let videoUrl = response.video;

  if (config.ENVIROMENT == "dev") {
    videoUrl = createUrlForEmulator(videoUrl);
  }

  const splitedVideoUrl = videoUrl.split('.');
  const videoType = splitedVideoUrl[splitedVideoUrl.length - 1];
  const attachment = {title: response.title, video_url: videoUrl, video_type: `video/${videoType}`};
  msg.attachments = [attachment];

  return await driver.sendMessage(msg);
}

async function sendSingleChoiceMessage(response,roomId){
  const msg = await driver.prepareMessage(he.decode(response.text), roomId);
  const singleChoice={
    title:response.dropdownPlaceholder,
    options:response.choices
  }
  msg.singleChoice=singleChoice;

  return await driver.sendMessage(msg)
}

async function sendCarouselMessage(response, roomId) {
  const msg = await driver.prepareMessage(response.text, roomId);
  const attachments = [];

  for (const element of response.elements) {
    const attachment = createButtons(element.title, element.buttons);
    attachments.push(attachment);
  }

  msg.attachments = attachments;

  return await driver.sendMessage(msg);
}

async function sendQuickRepliesMessage(response, roomId) {
  const msg = await driver.prepareMessage('', roomId);
  const attachment = createButtons(response.wrapped.text, response.quick_replies);
  msg.attachments = [attachment];

  return await driver.sendMessage(msg);
}

async function sendDropdownMessage(response, roomId) {
  const msg = await driver.prepareMessage('', roomId);
  response.options = response.options || [];
  processDropdownButtons(response.options);

  const attachment = createButtons(response.message, response.options);
  msg.attachments = [attachment];

  return await driver.sendMessage(msg);
}

function processDropdownButtons(options) {
  // Transform dropdown options to parsable buttons
  for (const option of options) {
    option.title = option.label;
    option.payload = option.value;
  }
}

function createButtons(title, replies) {
  const attachment = {};
  attachment.button_alignment = 'horizontal';
  attachment.title = he.decode(title);

  const actions = [];
  replies = replies || [];
  for (const quickReply of replies) {
    actions.push({
      type: 'button',
      text: he.decode(quickReply.title),
      msg: he.decode(quickReply.payload),
      msg_in_chat_window: true,
    });
  }
  attachment.actions = actions;

  return attachment;
}

function createUrlForEmulator(url) {
  const botpressUrl = "http://localhost:3000";
  const emulatorUrl = "http://10.0.2.2:8000";
  
  return url.replace(botpressUrl, emulatorUrl);
}


exports.sendMessage = sendMessage;
