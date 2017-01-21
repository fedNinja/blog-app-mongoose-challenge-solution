exports.DATABASE_URL =process.env.DATABASE_URL ||
                      global.DATABASE_URL ||
                      (process.env.NODE_ENV === 'production' ?
                           'mongodb://mongoose_user:payal123@ds117889.mlab.com:17889/blog-mongoose' :
                           'mongodb://localhost/blog-app');
exports.PORT = process.env.PORT || 8080;