const router = require("express").Router();
const Group = require("../models/Group")

router.get("/:userId", async (req, res)=>{
   
      try{
        const group = await Group.find({
            members:{ $all: [req.params.userId] }
          })
        res.status(201).json(group)
      }catch(err){
        res.status(500).json(err);
      }

})

// =================================Добавить пользователя в групу===================
router.post("/add", async (req, res)=>{
    const candidate = await Group.findOne({
      members:req.body.userId
    })
    if(candidate){
      res.status(500).json({
        message:"Такой пользователь уже есть в групе"
      });
    }else{
      const group = await Group.findOne({
        _id:req.body.groupId
      })
      group.members.push(req.body.userId)
      try{
        group.save()
        res.status(201).json(group)
      }catch(err){
        res.status(500).json(err);
      }

    }
  
  })
  // ================GROUP создать=====================
  router.post("/", async (req, res) => {
      const groupCandidate = await Group.findOne({name:req.body.name})
      if(groupCandidate){
        res.status(500).json({
          message:"Група с таким неймом уже есть, давай меняй"
        });
      }else{
        const newGroup = new Group({
          name:req.body.name,
          members: [req.body.senderId],
        });
  
      try {
        const newGroupSave = await newGroup.save();
        res.status(200).json(newGroupSave);
      } catch (err) {
        res.status(500).json(err);
      }
      }
  
    
   
  
  });
  module.exports = router;