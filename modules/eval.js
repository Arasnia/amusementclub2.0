const User      = require('../collections/user')
const asdate    = require('add-subtract-date')

const cardPrices = [ 350, 1000, 3000, 10000, 15000 ]
const evalUserRate = 0.25
const evalVialRate = 0.055
const evalLastDaily = asdate.subtract(new Date(), 6, 'months');

let userCount

const evalCard = async (ctx, card, modifier = 1) => {
    if(card.hasOwnProperty('eval'))
        return card.eval

    if(!userCount) {
        userCount = await User.countDocuments({ lastdaily: { $gt: evalLastDaily }})
    }
    
    const amount = await User.countDocuments({
        cards: { $elemMatch: { id: card.id }}, 
        lastdaily: { $gt: evalLastDaily }})

    const price = Math.round(((cardPrices[card.level] + (card.animated? 100 : 0))
        * limitPriceGrowth((userCount * evalUserRate) / amount)) * modifier)

    return price === Infinity? 0 : price
}

const limitPriceGrowth = x => { 
    if(x<1) return x
    else if(x<10) return (Math.log(x)/1.3)+Math.sqrt(x)*(-0.013*Math.pow(x,2)+0.182*x+0.766)
    else return Math.pow(x, 0.2) + 4.25
}

const getVialCost = async (ctx, card, cardeval) => {
    if(!cardeval)
        cardeval = await evalCard(ctx, card)

    if(cardeval === 0)
        return Infinity

    let diff = cardeval / (cardPrices.slice().reverse()[card.level] * evalVialRate)
    if(diff === Infinity) 
        diff = 0

    return Math.round(10 + diff)
}

module.exports = {
    evalCard,
    getVialCost
}
