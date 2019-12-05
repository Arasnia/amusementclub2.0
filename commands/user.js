const msToTime = require('pretty-ms')
const {cmd} = require('../utils/cmd')
const paginator = require('../utils/paginator')
const {
    formatName,
    withCards
} = require('../modules/card')

cmd('bal', ({ reply }, user) => {
    return reply(user, `you have **${Math.floor(user.exp)}** {currency}`)
})

cmd('inv', ['inventory', 'check'], ({ reply }, user, ...args) => {
    if (user.inventory.length == 0) {
        return reply(user, 'your inventory is empty')
    }

    const items = user.inventory
        .map((item, index) => `${index+1}. ${item.name}`)

    return reply(user, items.join(' '))
})

cmd('daily', async ({ reply }, user) => {
    user.lastdaily = user.lastdaily || new Date(0)

    const now = new Date()
    const future = user.lastdaily
    future.setHours(user.lastdaily.getHours() + 20)

    if(future < now) {
        const amount = 300

        user.lastdaily = now
        user.dailystats = {}
        user.exp += amount
        await user.save()

        return reply(user, `you recieved daily **${amount}** {currency} You now have **${user.exp}** {currency}`)
    }

    return reply(user, `you can claim your daily in **${msToTime(future - now)}**`)
})

cmd('cards', 'li', withCards(async (ctx, user, cards, parsedargs) => {
    const pages = []

    cards.map((c, i) => {
        if (i % 15 == 0) pages.push("")
        pages[Math.floor(i/15)] += (formatName(c) + (c.amount > 1? `(x${c.amount})\n` : '\n'))
    })

    return await paginator.addPagination(ctx, user, `your cards (${user.cards.length} results)`, pages)
}))
