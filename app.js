require("dotenv").config()

const express = require("express")
const path = require("path")
const { randomFromTo, randomString } = require("./utils/random")
const expressPinoLogger = require("express-pino-logger")
const logger = require("./logger/logger")

const loggerMiddleware = expressPinoLogger({
    logger,
})

const app = express()

app.use(loggerMiddleware)

let server = app.listen(process.env.PORT || Number(process.env.DEV_PORT) ,() => {
    console.log(`Listening on port ${process.env.PORT || 5000}`)
 })

const io = require("socket.io")(server)

let connectedUsers = [] // holds IDs of all connected users
let availableUsers = [] // holds IDs of all available users
let numOfConnectedUsers = 0
let groups = []
let pairedUsers = {
    pairs: []
}

const connectTwoUsers = (socketId) => {
    let otherUserId = availableUsers[randomFromTo(availableUsers.length)]
    while(!otherUserId){
        console.log("pickign again")
        otherUserId = availableUsers[randomFromTo(availableUsers.length)]
    }
    console.log("other user id picked: ",otherUserId)
    io.emit("get other user id", {
        for: socketId,
        otherUserId 
    })
    io.emit("get other user id", {
        for: otherUserId,
        otherUserId: socketId 
    })
    let newPair = {
        user1Id: socketId,
        user2Id: otherUserId
    }
    pairedUsers.pairs.push(newPair)
    //remove sended ID from available users
    let otherUserIdx = availableUsers.indexOf(otherUserId)
    availableUsers = availableUsers.filter((id, idx) => {
        if(idx !== otherUserIdx){
            return id
        }
    })
    logger.info("Users paired")
}

io.on("connection", socket => {
    if(socket.handshake.headers.referer.includes("group")){
        return
    }
    logger.info("New socket connection established")
    connectedUsers.push(socket.id) // add socket id to connectedUsers
    numOfConnectedUsers++

    /* io.emit("get number of users", {
        for: socket.id,
        numOfConnectedUsers
    }) */

    if(availableUsers.length > 0){
        connectTwoUsers(socket.id)
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
        logger.info("User disconnected")
        numOfConnectedUsers--
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
        else{
            let isUserPaired = false
            pairedUsers.pairs.map((pair, pairIdx) => {
                if(pair.user1Id === socket.id || pair.user2Id === socket.id){
                    isUserPaired = true
                    console.log("ale no ")
                    let otherUserId = ""
                    if(pair.user1Id === socket.id)
                        otherUserId = pair.user2Id
                    else
                        otherUserId = pair.user1Id
                    io.emit("other user disconnected", {
                        for: otherUserId,
                        u1: pair.user1Id,
                        u2: pair.user2Id
                    })
                    if(availableUsers.length > 0){
                        connectTwoUsers(otherUserId)
                    }
                    else
                        availableUsers.push(otherUserId)
                    pairedUsers.pairs.splice(pairIdx, 1)
                }
            })
            if(!isUserPaired){
                let deleteGroup = false
                let deleteGroupIdx = 0
                groups.map((group, groupIdx) => {
                    if(group.users.includes(socket.id)){
                        group.users.splice(group.users.indexOf(socket.id), 1)
                        if(group.users.length === 0){
                            deleteGroup = true
                            deleteGroupIdx = groupIdx
                        }
                    }
                })
                if(deleteGroup){
                    groups.splice(deleteGroupIdx, 1)
                }
            }
        }
    })

    socket.on("Create group", data => {
        let newGroupId = randomString(12)
        io.emit("Admin group id", {
            for: data.owner,
            groupId: newGroupId
        })
        availableUsers.splice(availableUsers.indexOf(socket.id), 1)
        let newGroup = {
            id: newGroupId,
            users: [data.owner]
        }
        groups.push(newGroup)
        pairedUsers.pairs.map((pair, pairIdx) => {
            if(pair.user1Id === socket.id || pair.user2Id === socket.id){
                console.log("ale no ")
                let otherUserId = ""
                if(pair.user1Id === socket.id)
                    otherUserId = pair.user2Id
                else
                    otherUserId = pair.user1Id
                io.emit("other user disconnected", {
                    for: otherUserId,
                    u1: pair.user1Id,
                    u2: pair.user2Id
                })
                if(availableUsers.length > 0){
                    connectTwoUsers(otherUserId)
                }
                else
                    availableUsers.push(otherUserId)
                pairedUsers.pairs.splice(pairIdx, 1)
            }
        })
    })

    socket.on("Join group", data => {
        let groupExists = false
        let groupId = 0
        groups.map((group, groupIdx) => {
            if(group.id === data.groupId){
                groupExists = true
                groupId = groupIdx
            }
        })
        if(groupExists){
            availableUsers.splice(availableUsers.indexOf(socket.id), 1)
            groups[groupId].users.push(socket.id)
            io.emit("Join group resolve", {
                for: data.for,
                success: true,
                groupId: data.groupId
            })
            pairedUsers.pairs.map((pair, pairIdx) => {
                if(pair.user1Id === socket.id || pair.user2Id === socket.id){
                    console.log("ale no ")
                    let otherUserId = ""
                    if(pair.user1Id === socket.id)
                        otherUserId = pair.user2Id
                    else
                        otherUserId = pair.user1Id
                    io.emit("other user disconnected", {
                        for: otherUserId,
                        u1: pair.user1Id,
                        u2: pair.user2Id
                    })
                    if(availableUsers.length > 0){
                        connectTwoUsers(otherUserId)
                    }
                    else
                        availableUsers.push(otherUserId)
                    pairedUsers.pairs.splice(pairIdx, 1)
                }
            })
        }
        else{
            io.emit("Join group resolve", {
                for: data.for,
                success: false
            })
        }
    })

    socket.on("group message", data => {
        io.emit("recieve group message", {
            groupId: data.groupId,
            message: data.message,
            from: data.from
        })
    })

})

app.use(express.static(path.resolve("./", "static")))

app.get("/", (req, res) => {
    res.status(200).sendFile(path.resolve("./", "views", "index.html"))
})

app.get("/users", (req, res) => {
    let responseJSON = {
        availableUsers,
        connectedUsers,
        pairedUsers,
        groups
    }
    res.status(200).type("application/json").send(JSON.stringify(responseJSON))
})

app.get("/xd", (req, res) => {
   res.status(200).sendFile(path.resolve("./", "views", "sv_slovo.html"))
})

app.get("/group", (req, res) => {
    res.status(200).sendFile(path.resolve("./", "views", "group.html"))
})