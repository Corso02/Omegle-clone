require("dotenv").config()

const express = require("express")
const path = require("path")
const { randomFromTo } = require("./utils/random")

const app = express()

let server = app.listen(Number(process.env.DEV_PORT) ,() => {
    console.log(`Listening on port ${process.env.DEV_PORT}`)
 })

const io = require("socket.io")(server)

let connectedUsers = [] // holds IDs of all connected users
let availableUsers = [] // holds IDs of all available users

io.on("connection", socket => {
    connectedUsers.push(socket.id) // add socket id to connectedUsers

    if(availableUsers.length > 0){
        // if there is/are user/s waiting send one of their ID to the new user
        let otherUserId = availableUsers[randomFromTo(availableUsers.length)]
        io.emit("get other user id", {
            for: socket.id,
            otherUserId 
        })
        //remove sended ID from available users
        let otherUserIdx = availableUsers.indexOf(otherUserId)
        availableUsers = availableUsers.filter((id, idx) => {
            if(idx !== otherUserIdx){
                return id
            }
        })
    }
    // if there is not any available user add new user to this array
    else{
        availableUsers.push(socket.id)
        console.log("pridane")
        console.log(availableUsers)
    }

    socket.on("send message", data => {
        io.emit("recieve message", {
            for: data.for,
            message: data.message
        })
    })

    socket.on("disconnect", () => {
        connectedUsers = connectedUsers.filter(id => {
            if(socket.id !== id){
                return id
            }
        })
        if(availableUsers.includes(socket.id)){
            availableUsers = availableUsers.filter(id => {
                if(socket.id !== id){
                    return id
                }
            })
        }
    })
})

app.use(express.static(path.resolve("./", "static")))

app.get("/", (req, res) => {
    res.status(200).sendFile(path.resolve("./", "views", "index.html"))
})

