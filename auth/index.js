const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../db/user');

router.get('/', (req, res, next) => {
    res.json('Whatever!')
})

function validUser(user) {
    return typeof user.email == 'string' &&
        user.email.trim() != '' &&
        typeof user.password == 'string' &&
        user.password.trim() != '' &&
        user.password.trim().length >= 5;
}
router.post('/signup', (req, res, next) => {
    if (validUser(req.body)) {
        User.getOneByEmail(req.body.email)
            .then((user) => {
                if (!user) {
                    bcrypt.hash(req.body.password, 8)
                        .then((hash) => {
                            const user = {
                                email: req.body.email,
                                password: hash,
                                created_at: new Date()
                            }


                            User.create(user).then(id => {
                              setUserIdCookie(req,res, id);
                                res.json({
                                    id,
                                    message: 'Success'
                                });

                            })

                        });
                } else {
                    next(new Error('Email in Use'))
                }
            });
    } else {
        next(new Error('Invalid User!'))
    }
});

function setUserIdCookie(req,res,id) {
  const isSecure = req.app.get('env'!= 'development')
  res.cookie('user_id', id, {
    httpOnly: true,
    signed: true,
    secure: isSecure
  });
}

router.post('/login', (req, res, next) => {
    if (validUser(req.body)) {
        User.getOneByEmail(req.body.email)
            .then((user) => {
              if(user) {
                bcrypt.compare(req.body.password, user.password).then((result)=>{
                  console.log(result);
                  if(result===true) {
                    setUserIdCookie(req,res, user.id);
                    res.json({
                      id: user.id,
                      message: 'Logged In!'
                    });
                  } else next(new Error('Wrong Password'))

                })
              } else next(new Error('Invalid Login'))
            })

    } else next(new Error('Invalid Login'))
});

router.get('/logout', (req,res)=>{
  res.clearCookie('user_id');
  res.json({
    message: 'LoggedOut'
  })
});
module.exports = router;
