const {cmd}             = require('../utils/cmd')
const colors            = require('../utils/colors')
const msToTime          = require('pretty-ms')
const _                 = require('lodash')
const pjson             = require('../package.json');
const { fetchOnly }     = require('../modules/user')
const { 
    arrayChunks, 
    getAllUserIDs 
} = require('../utils/tools')

cmd('help', async (ctx, user, ...args) => {
    let sbj = 'general'
    let sendHere = false

    args.map(x => {
        if(x === '-here') sendHere = true
        else sbj = x
    })

    const help = ctx.help.find(x => x.type.includes(sbj))
    if(!help)
        return ctx.reply(user, `can't find help for \`${sbj}\``, 'red')

    if(sendHere){
        const curpgn = getHelpEmbed(ctx, help, ctx.guild.prefix)
        return ctx.pgn.addPagination(user.discord_id, ctx.msg.channel.id, curpgn)

    } else {
        try {
            const ch = await ctx.bot.getDMChannel(user.discord_id)
            const curpgn = getHelpEmbed(ctx, help, `+`)
            curpgn.embed.description = `> NOTE: This help message has standard prefix \`+\` which can be different in guilds (servers).\n
                ${curpgn.embed.description}`
            await ctx.pgn.addPagination(user.discord_id, ch.id, curpgn)

            if(ch.id != ctx.msg.channel.id)
                await ctx.reply(user, `help was sent to you. 
                    You can also use *-here* (e.g. \`${ctx.guild.prefix}help guild -here\`) to see help in the current channel`)

        } catch (e) {
            await ctx.reply(user, `failed to send direct message to you ੨( ･᷄ ︵･᷅ )ｼ
                Please make sure you have **Allow direct messages from server members** enabled in server privacy settings.
                You can do it in any server that you share with bot.
                You also can add *-here* (e.g. \`${ctx.guild.prefix}help guild -here\`) to see help in the current channel`, 'red')
        }
    }
}).access('dm')

cmd('rules', async (ctx, user) => {
    const help = ctx.help.find(x => x.type.includes('rules'))
    return ctx.pgn.addPagination(user.discord_id, ctx.msg.channel.id, getHelpEmbed(ctx, help, `+`))
}).access('dm')

cmd('baka', async (ctx, user, ...args) => {
    const time = msToTime(Date.now() - new Date(ctx.msg.timestamp))
    return ctx.reply(user, `you baka in \`${time}\``)
})

cmd('pat', async (ctx, user, ...args) => {
    const otherid = getAllUserIDs(args).ids[0]
    if(!otherid) return

    const otheruser = await fetchOnly(otherid)
    if(!otheruser) return

    const embed = { 
        description: `**${user.username}** pats **${otheruser.username}** ${_.sample(pats)}`,
        color: Math.floor(Math.random() * 16777215)
    }
    return ctx.send(ctx.msg.channel.id, embed, user.discord_id)
})

cmd('invite', async (ctx, user) => {
    const embed = { 
        title: `Invite amusement Club`,
        description: `Please, read terms and conditions of using bot on your server by typing \`+help invite\` 
            After that [click here](${ctx.invite}) to invite the bot.`,
        color: colors.green
    }

    return ctx.send(ctx.msg.channel.id, embed, user.discord_id)
})

const getHelpEmbed = (ctx, o, prefix) => {

    const footerText = `amusement Club Alexandrite | xQAxThF | v${pjson.version} | by NoxCaos#4905`
    const embed = {
        title: o.title, 
        description: o.description.replace(/+/g, prefix), fields: [],
        footer: { text: footerText },
        color: colors['green']
    }

    const pages = arrayChunks(o.fields.map((x) => ({ 
        name: x.title.replace(/+/g, prefix), 
        inline: x.inline, 
        value: x.description.replace(/+/g, prefix)
    })), 6)

    return {
        pages, embed,
        buttons: ['back', 'forward'],
        switchPage: (data) => { 
            data.embed.fields = data.pages[data.pagenum]
            data.embed.footer.text = `- Page ${data.pagenum + 1}/${pages.length} - | ${footerText}`
        }
    }

    return e
}

const pats = [
    '(；^＿^)ッ☆(　゜o゜)',
    '(　´Д｀)ﾉ(´･ω･`)　ﾅﾃﾞﾅﾃﾞ',
    '(*￣▽￣)ノ”(^ー^*)',
    '(*￣▽￣)ノ”(- -*)',
    '(*￣▽￣)ノ”(ﾟ∇ﾟ*)',
    '(*￣▽￣)ノ”(ﾟーﾟ*)',
    '(*’-’)ノ”(^o^*)',
    '(ｏ・_・)ノ”(ᴗ_ ᴗ。)',
    '(*´・ω・)ノ(-ω-｀*)',
    '(o・_・)ノ”(ノ_＜。)'
]
