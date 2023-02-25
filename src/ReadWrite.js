

export const ReadWrite = {

    async read(url) {
        return await fetch(url).then( r => r.json() );
    },

    write(url, data) {

    }
}