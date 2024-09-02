"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeUserDetectionOnMessage = activeUserDetectionOnMessage;
exports.activeUserInteractionHandler = activeUserInteractionHandler;
const cache_1 = require("./cache");
const active_user_1 = require("./active_user");
const logging_1 = require("../logging");
const discord_utils_1 = require("../../discord_utils");
const { WELCOME_CHANNEL_ID } = require("../../constants");
function activeUserDetectionOnMessage(message, client) {
    if (!isNewActiveUser(message)) {
        return;
    }
    const author_member = (0, discord_utils_1.guildMemberFromMessage)(message);
    if (!cache_1.default.hasMember(author_member.id)) {
        const active_user = new active_user_1.NewActiveUser(author_member, client);
        cache_1.default.addMember(active_user);
    }
    cache_1.default.increaseMemberHit(author_member, message, client);
}
function isNewActiveUser(message) {
    // exclude messages from the welcome channel
    if (message.channelId === WELCOME_CHANNEL_ID) {
        return false;
    }
    const author_member = (0, discord_utils_1.guildMemberFromMessage)(message);
    // because there is the @everyone role
    return (author_member?.roles?.cache?.size ?? 2) <= 1;
}
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
