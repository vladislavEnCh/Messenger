const router = require("express").Router();
const Conversation = require("../models/Conversation");

//new conv


router.post("/conversation",async (req, res) => {
  try{ 
    const conv = await Conversation.findOne({
      members: { $all: [req.body.senderId, req.body.receiverId] },
    });
    res.status(200).json(conv);
  }catch (err) {
    res.status(500).json(err);
  }
  
})


// +=========================CREATE CONV======================

router.post("/", async (req, res) => {
  const candidateConversation = await Conversation.findOne({
    members: { $all: [req.body.senderId, req.body.receiverId] },
  });
  // const candidateConversation = await Conversation.findOne({members: req.body.receiverId})
  if(candidateConversation){
    res.status(409).json({
      message: 'Такой диалог уже есть'
    })
  }else{
    const newConversation = new Conversation({
      members: [req.body.senderId, req.body.receiverId],
    });
    try {
      const savedConversation = await newConversation.save();
      res.status(200).json(savedConversation);
    } catch (err) {
      res.status(500).json(err);
    }
  }
 

});

//get conv of a user

router.get("/:userId", async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members:  req.params.userId ,
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});




module.exports = router;
