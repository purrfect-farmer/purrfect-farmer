export var ApiMessageEntityTypes;
(function (ApiMessageEntityTypes) {
    ApiMessageEntityTypes["Bold"] = "MessageEntityBold";
    ApiMessageEntityTypes["Blockquote"] = "MessageEntityBlockquote";
    ApiMessageEntityTypes["BotCommand"] = "MessageEntityBotCommand";
    ApiMessageEntityTypes["Cashtag"] = "MessageEntityCashtag";
    ApiMessageEntityTypes["Code"] = "MessageEntityCode";
    ApiMessageEntityTypes["Email"] = "MessageEntityEmail";
    ApiMessageEntityTypes["Hashtag"] = "MessageEntityHashtag";
    ApiMessageEntityTypes["Italic"] = "MessageEntityItalic";
    ApiMessageEntityTypes["MentionName"] = "MessageEntityMentionName";
    ApiMessageEntityTypes["Mention"] = "MessageEntityMention";
    ApiMessageEntityTypes["Phone"] = "MessageEntityPhone";
    ApiMessageEntityTypes["Pre"] = "MessageEntityPre";
    ApiMessageEntityTypes["Strike"] = "MessageEntityStrike";
    ApiMessageEntityTypes["TextUrl"] = "MessageEntityTextUrl";
    ApiMessageEntityTypes["Url"] = "MessageEntityUrl";
    ApiMessageEntityTypes["Underline"] = "MessageEntityUnderline";
    ApiMessageEntityTypes["Spoiler"] = "MessageEntitySpoiler";
    ApiMessageEntityTypes["CustomEmoji"] = "MessageEntityCustomEmoji";
    ApiMessageEntityTypes["Timestamp"] = "MessageEntityTimestamp";
    ApiMessageEntityTypes["QuoteFocus"] = "MessageEntityQuoteFocus";
    ApiMessageEntityTypes["Unknown"] = "MessageEntityUnknown";
})(ApiMessageEntityTypes || (ApiMessageEntityTypes = {}));
export const MAIN_THREAD_ID = -1;
// `Symbol` can not be transferred from worker
export const MESSAGE_DELETED = 'MESSAGE_DELETED';
