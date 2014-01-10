    var connect     = require('connect'),
        brackets    = require('brackets');

    connect()
        .use('/brackets', brackets())
        .use(function (req, res) {
            res.end('Hello World');
        })
        .listen(3000);
