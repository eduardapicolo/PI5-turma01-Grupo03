const User = require('../models/User');


const userRepository = {
  findById:      (id) => User.findById(id).select('-__v'),

  findByEmail:   (email) => User.findOne({ email: email.toLowerCase() }),

  findByGoogleId: (googleId) => User.findOne({ googleId }),

  create:        (data) => User.create(data),

  updateById: (id, data) =>
    User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-__v'),


  findAllOngs: () =>
    User.find({ role: { $in: ['ong', 'admin'] }, isActive: true }).select('name ongName email avatar'),
};

module.exports = userRepository;
