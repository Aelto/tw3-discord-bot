"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeUserInteractionHandler = exports.cacheNewActiveUser = exports.isNewActiveUser = void 0;
const cache_1 = require("./cache");
const active_user_1 = require("./active_user");
const logging_1 = require("../logging");
function isNewActiveUser(message) {
    const author_member = message.member || message.guild.members.cache.get(message.author.id);
    // TODO: remove it
    return true;
    return author_member.roles.cache.size <= 1; // because there is the @everyone role
}
exports.isNewActiveUser = isNewActiveUser;
function cacheNewActiveUser(message, client) {
    const author_member = message.member || message.guild.members.cache.get(message.author.id);
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
