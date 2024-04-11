
module.exports = {
  server: {
    port: process.env.PORT || 3000,
    mongoDBConnectionUrl: `mongodb+srv://Aaquib5076:${process.env.DB_PASSWORD}@cluster0.oknup.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
  }
}
