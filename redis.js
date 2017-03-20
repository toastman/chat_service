const redis = require('redis')
const config = require('./config.json')

const redisConnected = new Promise((res, rej) => {
    const client = redis.createClient(config.redis_url)

    client
        .on('connect', () => res(client))
        .on('error', err => rej(err))
})

redisConnected.catch(err => console.error(err.stack))

module.exports = redisConnected