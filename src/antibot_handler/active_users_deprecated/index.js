"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeUserInteractionHandler = exports.cacheNewActiveUser = exports.isNewActiveUser = void 0;
const cache_1 = require("./cache");
const active_user_1 = require("./active_user");
const logging_1 = require("../logging");
const { WELCOME_CHANNEL_ID } = require("../../constants");
function isNewActiveUser(message) {
    // exclude messages from the welcome channel
    if (message.channelId === WELCOME_CHANNEL_ID) {
        return false;
    }
    const author_member = message.member || message.guild.members.cache.get(message.author.id);
    // because there is the @everyone role
    return (author_member?.roles?.cache?.size ?? 2) <= 1;
}
exports.isNewActiveUser = isNewActiveUser;
function cacheNewActiveUser(message, client) {
    const author_member = message.member || message.guild.members.cache.get(message.author.id);
    if (!author_member) {
        return;
    }
    if (!cache_1.default.increaseMemberHit(author_member, client)) {
        const active_user = new active_user_1.NewActiveUser(author_member, client);
        cache_1.default.addMember(active_user);
    }
}
exports.cacheNewActiveUser = cacheNewActiveUser;
async function activeUserInteractionHandler(interaction, client) {
    if (interaction.customId.startsWith("active_user_allow;")) {
        const [id, member_id] = interaction.customId.split(";");
        const user = cache_1.default.getMember(member_id);
        if (user) {
            user.allow_user();
            (0, logging_1.log_new_active_user_allowed)(client, member_id);
            cache_1.default.deleteMember(member_id);
        }
    }
    else if (interaction.customId.startsWith("active_user_postpone;")) {
        const [id, member_id] = interaction.customId.split(";");
        const user = cache_1.default.getMember(member_id);
        if (user) {
            user.increaseHitGoal(client);
        }
    }
}
exports.activeUserInteractionHandler = activeUserInteractionHandler;
