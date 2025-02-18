const {
    byAlias, 
    bestColMatch,
    reset
} = require('../modules/collection')

const {
    formatName,
    mapUserCards
} = require('../modules/card')

const {cmd}         = require('../utils/cmd')
const {nameSort}    = require('../utils/tools')
const colors        = require('../utils/colors')
const _             = require('lodash')

cmd('col', 'cols', 'collection', 'collections', async (ctx, user, ...args) => {
    const completed = args.find(x => x === '-completed' || x === '!completed')
    args = args.filter(x => x != '-completed' && x != '!completed')

    let cols = byAlias(ctx, args.join().replace('-', ''))
        .sort((a, b) => nameSort(a, b, 'id'))

    if(completed) {
        if(completed[0] === '-') 
            cols = cols.filter(x => user.completedcols.some(y => y.id === x.id))
        else
            cols = cols.filter(x => !user.completedcols.some(y => y.id === x.id))
    }

    if(cols.length === 0)
        return ctx.reply(user, `no collections found`, 'red')

    const cardmap = mapUserCards(ctx, user)
    const pages = ctx.pgn.getPages(cols.map(x => {
        const complete = user.completedcols.find(y => x.id === y.id)
        const overall = ctx.cards.filter(c => c.col === x.id).length
        const usercount = cardmap.filter(c => c.col === x.id).length
        const rate = usercount / overall
        const completestars = complete && complete.amount > 0? `[${complete.amount}${ctx.symbols.star}] ` : ''
        return `${completestars}**${x.name}** \`${x.id}\` ${rate != 0? `(${Math.round(rate * 100)}%)` : ''}`
    }))

    return ctx.pgn.addPagination(user.discord_id, ctx.msg.channel.id, {
        pages,
        buttons: ['back', 'forward'],
        embed: {
            author: { name: `found ${cols.length} collections` }
        }
    })
})

cmd(['col', 'info'], ['collection', 'info'], async (ctx, user, ...args) => {
    const col = bestColMatch(ctx, args.join().replace('-', ''));

    if(!col)
        return ctx.reply(user, `found 0 collections matching \`${args.join(' ')}\``, 'red')

    const colCards = ctx.cards.filter(x => x.col === col.id && x.level < 6)
    const userCards = mapUserCards(ctx, user).filter(x => x.col === col.id && x.level < 6)
    const card = _.sample(colCards)
    const clout = user.completedcols.find(x => x.id === col.id)

    const resp = []
    resp.push(`Overall cards: **${colCards.length}**`)
    resp.push(`You have: **${userCards.length} (${((userCards.length / colCards.length) * 100).toFixed(2)}%)**`)

    if(clout && clout.amount > 0)
        resp.push(`Your clout: **${new Array(clout.amount + 1).join('★')}** (${clout.amount})`)

    resp.push(`Aliases: **${col.aliases.join(" **|** ")}**`)

    if(col.origin) 
        resp.push(`[More information about fandom](${col.origin})`)

    resp.push(`Sample card: ${formatName(card)}`)

    return ctx.send(ctx.msg.channel.id, {
        title: col.name,
        image: { url: card.url },
        description: resp.join('\n'),
        color: colors.blue
    }, user.discord_id)
})

cmd(['col', 'reset'], ['collection', 'reset'], async (ctx, user, ...args) => {
    const col = bestColMatch(ctx, args.join().replace('-', ''));

    if(!col)
        return ctx.reply(user, `found 0 collections matching \`${args.join(' ')}\``, 'red')

    const legendary = ctx.cards.find(x => x.col === col.id && x.level === 6)
    const colCards = ctx.cards.filter(x => x.col === col.id && x.level < 6)
    let userCards = mapUserCards(ctx, user).filter(x => x.col === col.id && x.level < 6)

    if(userCards.length < colCards.length)
        return ctx.reply(user, `you have to have **100%** of the cards from collection (excluding legendaries) in order to reset it`, 'red')

    const question = `Do you really want to reset **${col.name}**?
        You will lose 1 copy of each card from that collection and gain 1 clout star${legendary? ' + legendary' : 
        `\n> Please note that you won't get legendary card ticket because this collection doesn't have any legendaries`}`

    return ctx.pgn.addConfirmation(user.discord_id, ctx.msg.channel.id, {
        question,
        onConfirm: (x) => reset(ctx, user, col),
    })
})
