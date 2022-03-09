const router = require('express').Router();
const sharp = require('sharp');
const auth = require('../middleware/auth');
const User = require('../models/user');
const upload = require('../utils/fileUpload');
const { sendWelcomeEmail, sendCancelationEmail } = require('../email/account');

// desc: register user
// access: public
router.post('/users', async (req, res) => {
  const user = new User(req.body);
  sendWelcomeEmail(user.email, user.name);
  try {
    const token = await user.generateAuthToken(); // generates auth token and saves user 
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// desc: login user
// access: public
router.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// desc: logout user (from one session)
// access: private
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.send();
  } catch (e) {
    res.sendStatus(500);
  }
});

// desc: logout user (from all sessions)
// access: private
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.sendStatus(500);
  }
});

// desc: get user's profile
// access: private
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

// desc: update user
// access: private
router.patch('/users/me', auth, async (req, res) => {
  const allowedUpdates = ['name', 'age', 'password', 'age'];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates' });
  }

  try {
    updates.forEach((update) => req.user[update] = req.body[update]);
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

// desc: delete user
// access: private
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.sendStatus(500);
  }
});

// desc: upload user avatar
// access: private
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  // upload returns a buffer since we're not saving the file to a destination
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
  req.user.avatar = buffer;
  await req.user.save();
  res.send();
}, (err, req, res, next) => {
  res.status(400).send({ error: err.message });
});

// desc: delete user avatar
// access: private
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = null;
  await req.user.save();
  res.sendStatus(200);
});

// desc: get a user's avatar
// access: public
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error('avatar not found');
    }
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send({ error: e.message });
  }
});

module.exports = router;