if (process.env.NODE_ENV !== 'development') {
    throw new Error('Cannot run tests in not development mode')
}

process.env.MONGOMS_DOWNLOAD_URL = 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian11-7.0.12.tgz'
process.env.MONGOMS_VERSION = '7.0.12'
