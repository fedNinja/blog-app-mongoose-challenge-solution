exports.DATABASE_URL =process.env.DATABASE_URL ||
                      global.DATABASE_URL ||
                      (process.env.NODE_ENV === 'production' ?
                           'mongodb://mongoose_user:payal123@ds049538.mlab.com:49538/blog-app' :
                           'mongodb://localhost/blog-app');
exports.PORT = process.env.PORT || 8080;