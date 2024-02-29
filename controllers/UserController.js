const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const UserModel = require('../models/UserModel');
const RoleModel = require('../models/RoleModel');
const mongoose = require("mongoose");

// Register a new user
const register = async (req, res) => {
      try {
            const { email } = req.body
            const userExist = Boolean(await UserModel.findOne({ email }))

            if (!userExist) {
                  const salt = await bcrypt.genSalt(10);
                  const passwordHash = await bcrypt.hash(req.body.password, salt);

                  let user = await UserModel.create(
                        {
                              ...req.body,
                              password: passwordHash
                        }
                  );

                  return res.status(201).send(
                        {
                              status: true,
                              message: "User created successfully!",
                              token: jwt.sign({
                                    name: user.name,
                                    email: user.email,
                                    role: user.role,
                              }, process.env.JWT)
                        })
            }
            else {
                  return res.status(409).send({
                        status: false,
                        message: `User exist with ${email}`
                  })
            }
      }
      catch (err) {
            res.send({
                  status: false,
                  message: `Error in registration : ${err}`
            })
      }
}

// User Login
const login = async (req, res) => {
      try {
            const { email, password } = req.body
            const user = await UserModel.findOne({ email })
            const userExist = Boolean(await UserModel.findOne({ email }))

            if (!userExist) {
                  return res.status(401).json({
                        status: false,
                        message: `User doesn't exist`
                  })
            }

            const isPasswordValid = await bcrypt.compare(password, user.password)

            if (!user || !isPasswordValid) {
                  return res.status(401).json({
                        status: false,
                        message: "Invalid email or password"
                  })
            }

            const role = await RoleModel.findOne({ role: user.role })

            if (!role && user.role !== 'user') {
                  return res.status(500).send({
                        status: false,
                        message: "User role not found",
                  });
            }

            if (role || user.role === 'user') {

                  user.hasPermission = role?.hasPermission ? role?.hasPermission : []

                  await user.save()

                  const token = jwt.sign(
                        {
                              email: user.email,
                              name: user.name,
                              role: user.role
                        },
                        process.env.JWT,
                        {
                              expiresIn: '365d'
                        });

                  const {
                        password: pass,
                        ...userWithoutPassword
                  } = user;

                  res.status(200).json({
                        status: true,
                        message: "User logged in successfully!",
                        token: `Bearer ${token}`,
                        user: userWithoutPassword
                  });
            }
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`
            })
      }
}

// GET all users
const users = async (req, res) => {
      try {
            await search(req, res, '')
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`
            })
      }
}

// GET all user preferences
// const userPreferences = async (req, res) => {

//       try {
//             await UserModel.find({}, 'role hasPermission').exec()
//                   .then(users => {
//                         const userRolesAndPermissions = {
//                               roles: [...new Set(users.map(user => user.role))],
//                               permissions: [...new Set(users.reduce((acc, user) => acc.concat(user.hasPermission), []))]
//                         };

//                         res.status(200).json({
//                               status: true,
//                               preferences: userRolesAndPermissions
//                         });
//                   })
//                   .catch(err => {
//                         res.status(500).json({
//                               status: false,
//                               message: `${err}`
//                         });
//                   });

//       } catch (err) {
//             res.status(500).json({
//                   status: false,
//                   message: `${err}`
//             });
//       }

// }

// GET user by Id
const user = async (req, res) => {

      const { id } = req.params

      try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                  return res.status(404).json({
                        status: false,
                        message: `User Id Incorrect`
                  })
            }

            const foundUser = await UserModel.findById(id).select("-password").lean()

            if (!foundUser) {
                  return res.status(404).json({
                        status: false,
                        message: `User not found`,
                  });
            }

            const role = await RoleModel.findOne({ role: foundUser.role });

            if (!role) {
                  return res.status(500).json({
                        status: false,
                        message: "User role not found",
                  });
            }

            foundUser.hasPermission = role?.hasPermission ? role?.hasPermission : []

            await foundUser.save()

            res.status(200).json({
                  status: true,
                  user: foundUser
            })
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`
            })
      }
}

// get all picker packer
const getAllPickerPacker = async (req, res) => {
      try {
            const allUsers = await UserModel.find(
                  {
                        isDeleted: false,
                        site: req.body.site,
                        role: { $in: ["picker", "packer"] }
                  })
                  .select("-password")
                  .lean();

            for (let i = 0; i < allUsers.length; i++) {
                  const user = allUsers[i];
                  const role = await RoleModel.findOne({
                        role: { $regex: new RegExp(user.role, "i") },
                  }).lean()

                  if (role) {
                        allUsers[i] = {
                              ...user,
                              hasPermission: role.hasPermission,
                        };
                  }

                  user.save()
            }

            res.status(200).json({
                  status: true,
                  users: allUsers
            });
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`,
            });
      }
};

const changePassword = async (req, res) => {
      const { id } = req.params
      const { password, newPassword } = req.body

      try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                  return res.status(404).json({
                        status: false,
                        message: `User Id incorrect`
                  })
            }

            const user = await UserModel.findById(id).select("_id email password")
            const userExist = Boolean(user);

            if (!userExist) {
                  return res.status(401).json({
                        status: false,
                        message: `User doesn't exist`,
                  });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                  return res.status(401).json({
                        status: false,
                        message: "Invalid email or password",
                  });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await UserModel.findOneAndUpdate(
                  { _id: id },
                  { password: hashedPassword },
                  {
                        new: true,
                        projection: "_id email"
                  }
            );

            res.status(201).json({
                  status: true,
                  message: "User password updated successfully!"
            });
      } catch (error) {
            res.status(500).json({
                  status: false,
                  message: `${err}`,
            });
      }
};

// Update user by Id
const update = async (req, res) => {

      const { id } = req.params
      let userDetails = {}

      if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({
                  status: false,
                  message: `User Id incorrect`
            })
      }

      if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(req.body.password, salt);

            userDetails = {
                  ...req.body,
                  password: passwordHash,
                  updatedAt: new Date()
            }
      }
      else {
            userDetails = {
                  ...req.body,
                  updatedAt: new Date()
            }
      }

      try {
            let updatedUser = await UserModel.findByIdAndUpdate(id, userDetails, { new: true, runValidators: true })

            res.status(201).json({
                  status: true,
                  user: updatedUser
            })
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`
            })
      }
}

const search = async (req, res, status) => {

      let filter = {
            isDeleted: false,
            status
      };

      if (status === '') {
            filter = {
                  isDeleted: false
            };
      }
      if (req.query.filterBy && req.query.value) {
            filter[req.query.filterBy] = req.query.value;
      }

      const pageSize = +req.query.pageSize || 10;
      const currentPage = +req.query.currentPage || 1;
      const sortBy = req.query.sortBy || '_id'; // _id or description or code or po or etc.
      const sortOrder = req.query.sortOrder || 'desc'; // asc or desc

      const totalItems = await UserModel.find(filter).countDocuments();
      const items = await UserModel.find(filter)
            .skip((pageSize * (currentPage - 1)))
            .limit(pageSize)
            .sort({ [sortBy]: sortOrder })
            .select("-password")
            .lean()
            .exec()

      for (let i = 0; i < items.length; i++) {
            const user = items[i];
            const role = await RoleModel.findOne({
                  role: { $regex: new RegExp(user.role, "i") },
            }).lean();
            if (role) {
                  items[i] = {
                        ...user,
                        hasPermission: role.hasPermission,
                  };
            }

            // user.save();
      }

      const responseObject = {
            status: true,
            items,
            totalPages: Math.ceil(totalItems / pageSize),
            totalItems
      };

      if (items.length) {
            return res.status(200).json(responseObject);
      }

      else {
            return res.status(401).json({
                  status: false,
                  message: "Nothing found",
                  items
            });
      }
}

module.exports = {
      register,
      login,
      users,
      // userPreferences,
      user,
      getAllPickerPacker,
      changePassword,
      update
}