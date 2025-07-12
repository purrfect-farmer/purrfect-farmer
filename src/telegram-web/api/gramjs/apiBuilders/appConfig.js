import BigInt from 'big-integer';
import { Api as GramJs } from '../../../lib/gramjs';
import { DEFAULT_LIMITS, MAX_UNIQUE_REACTIONS, SERVICE_NOTIFICATIONS_USER_ID, STORY_EXPIRE_PERIOD, STORY_VIEWERS_EXPIRE_PERIOD, TODO_ITEM_LENGTH_LIMIT, TODO_ITEMS_LIMIT, TODO_TITLE_LENGTH_LIMIT, } from '../../../config';
import localDb from '../localDb';
import { buildJson } from './misc';
function buildEmojiSounds(appConfig) {
    const { emojies_sounds } = appConfig;
    return emojies_sounds ? Object.keys(emojies_sounds).reduce((acc, key) => {
        const l = emojies_sounds[key];
        localDb.documents[l.id] = new GramJs.Document({
            id: BigInt(l.id),
            accessHash: BigInt(l.access_hash),
            dcId: 1,
            mimeType: 'audio/ogg',
            fileReference: Buffer.alloc(0),
            size: BigInt(0),
        });
        acc[key] = l.id;
        return acc;
    }, {}) : {};
}
function getLimit(appConfig, key, fallbackKey) {
    const defaultLimit = appConfig[`${key}_default`] || DEFAULT_LIMITS[fallbackKey][0];
    const premiumLimit = appConfig[`${key}_premium`] || DEFAULT_LIMITS[fallbackKey][1];
    return [defaultLimit, premiumLimit];
}
export function buildAppConfig(json, hash) {
    const appConfig = buildJson(json);
    return {
        emojiSounds: buildEmojiSounds(appConfig),
        seenByMaxChatMembers: appConfig.chat_read_mark_size_threshold,
        seenByExpiresAt: appConfig.chat_read_mark_expire_period,
        readDateExpiresAt: appConfig.pm_read_date_expire_period,
        autologinDomains: appConfig.autologin_domains || [],
        urlAuthDomains: appConfig.url_auth_domains || [],
        maxUniqueReactions: appConfig.reactions_uniq_max ?? MAX_UNIQUE_REACTIONS,
        premiumBotUsername: appConfig.premium_bot_username,
        premiumInvoiceSlug: appConfig.premium_invoice_slug,
        premiumPromoOrder: appConfig.premium_promo_order,
        isPremiumPurchaseBlocked: appConfig.premium_purchase_blocked,
        isGiveawayGiftsPurchaseAvailable: appConfig.giveaway_gifts_purchase_available,
        defaultEmojiStatusesStickerSetId: appConfig.default_emoji_statuses_stickerset_id,
        topicsPinnedLimit: appConfig.topics_pinned_limit,
        maxUserReactionsDefault: appConfig.reactions_user_max_default,
        maxUserReactionsPremium: appConfig.reactions_user_max_premium,
        hiddenMembersMinCount: appConfig.hidden_members_group_size_min,
        giveawayAddPeersMax: appConfig.giveaway_add_peers_max,
        giveawayBoostsPerPremium: appConfig.giveaway_boosts_per_premium,
        giveawayCountriesMax: appConfig.giveaway_countries_max,
        boostsPerSentGift: appConfig.boosts_per_sent_gift,
        canDisplayAutoarchiveSetting: appConfig.autoarchive_setting_available,
        limits: {
            uploadMaxFileparts: getLimit(appConfig, 'upload_max_fileparts', 'uploadMaxFileparts'),
            stickersFaved: getLimit(appConfig, 'stickers_faved_limit', 'stickersFaved'),
            savedGifs: getLimit(appConfig, 'saved_gifs_limit', 'savedGifs'),
            dialogFiltersChats: getLimit(appConfig, 'dialog_filters_chats_limit', 'dialogFiltersChats'),
            dialogFilters: getLimit(appConfig, 'dialog_filters_limit', 'dialogFilters'),
            dialogFolderPinned: getLimit(appConfig, 'dialogs_pinned_limit', 'dialogFolderPinned'),
            captionLength: getLimit(appConfig, 'caption_length_limit', 'captionLength'),
            channels: getLimit(appConfig, 'channels_limit', 'channels'),
            channelsPublic: getLimit(appConfig, 'channels_public_limit', 'channelsPublic'),
            aboutLength: getLimit(appConfig, 'about_length_limit', 'aboutLength'),
            chatlistInvites: getLimit(appConfig, 'chatlist_invites_limit', 'chatlistInvites'),
            chatlistJoined: getLimit(appConfig, 'chatlist_joined_limit', 'chatlistJoined'),
            recommendedChannels: getLimit(appConfig, 'recommended_channels_limit', 'recommendedChannels'),
            savedDialogsPinned: getLimit(appConfig, 'saved_dialogs_pinned_limit', 'savedDialogsPinned'),
            moreAccounts: DEFAULT_LIMITS.moreAccounts,
        },
        hash,
        areStoriesHidden: appConfig.stories_all_hidden,
        storyExpirePeriod: appConfig.story_expire_period ?? STORY_EXPIRE_PERIOD,
        storyViewersExpirePeriod: appConfig.story_viewers_expire_period ?? STORY_VIEWERS_EXPIRE_PERIOD,
        storyChangelogUserId: appConfig.stories_changelog_user_id?.toString() ?? SERVICE_NOTIFICATIONS_USER_ID,
        maxPinnedStoriesCount: appConfig.stories_pinned_to_top_count_max,
        groupTranscribeLevelMin: appConfig.group_transcribe_level_min,
        canLimitNewMessagesWithoutPremium: appConfig.new_noncontact_peers_require_premium_without_ownpremium,
        starsPaidMessagesAvailable: appConfig.stars_paid_messages_available,
        starsPaidMessageCommissionPermille: appConfig.stars_paid_message_commission_permille,
        starsPaidMessageAmountMax: appConfig.stars_paid_message_amount_max,
        starsUsdWithdrawRateX1000: appConfig.stars_usd_withdraw_rate_x1000,
        bandwidthPremiumNotifyPeriod: appConfig.upload_premium_speedup_notify_period,
        bandwidthPremiumUploadSpeedup: appConfig.upload_premium_speedup_upload,
        bandwidthPremiumDownloadSpeedup: appConfig.upload_premium_speedup_download,
        channelRestrictAdsLevelMin: appConfig.channel_restrict_sponsored_level_min,
        channelAutoTranslationLevelMin: appConfig.channel_autotranslation_level_min,
        paidReactionMaxAmount: appConfig.stars_paid_reaction_amount_max,
        isChannelRevenueWithdrawalEnabled: appConfig.channel_revenue_withdrawal_enabled,
        isStarsGiftEnabled: appConfig.stars_gifts_enabled,
        starGiftMaxMessageLength: appConfig.stargifts_message_length_max,
        starGiftMaxConvertPeriod: appConfig.stargifts_convert_period_max,
        starRefStartPrefixes: appConfig.starref_start_param_prefixes,
        tonExplorerUrl: appConfig.ton_blockchain_explorer_url,
        savedGiftPinLimit: appConfig.stargifts_pinned_to_top_limit,
        freezeSinceDate: appConfig.freeze_since_date,
        freezeUntilDate: appConfig.freeze_until_date,
        freezeAppealUrl: appConfig.freeze_appeal_url,
        starsStargiftResaleAmountMin: appConfig.stars_stargift_resale_amount_min,
        starsStargiftResaleAmountMax: appConfig.stars_stargift_resale_amount_max,
        starsStargiftResaleCommissionPermille: appConfig.stars_stargift_resale_commission_permille,
        pollMaxAnswers: appConfig.poll_answers_max,
        todoItemsMax: appConfig.todo_items_max ?? TODO_ITEMS_LIMIT,
        todoTitleLengthMax: appConfig.todo_title_length_max ?? TODO_TITLE_LENGTH_LIMIT,
        todoItemLengthMax: appConfig.todo_item_length_max ?? TODO_ITEM_LENGTH_LIMIT,
    };
}
