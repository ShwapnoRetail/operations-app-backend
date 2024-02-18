const POTrackingModel = require('../models/POTrackingModel');
const mongoose = require('mongoose');

const postPOTracking = async (req, res) => {
      try {
            const { po } = req.body
            const filter = {
                  po
            }

            const isAlreadyPOInTracking = Boolean(await POTrackingModel.findOne(filter))

            if (isAlreadyPOInTracking) {
                  return res.status(409).send({
                        status: false,
                        message: `${po} has already been tracked`
                  })
            }
            else {
                  const data = await POTrackingModel.create(req.body)

                  return res.status(201).send({
                        status: true,
                        message: `${po} is ready for tracking`,
                        data
                  })
            }
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`
            });
      }
}

// const updatePOTracking = async (req, res) => {
//       try {
//             const { id } = req.params

//             if (!mongoose.Types.ObjectId.isValid(id)) {
//                   return res.status(404).json({
//                         status: false,
//                         message: `PO id incorrect`
//                   })
//             }

//             let POTracking = await POTrackingModel.findById(id)

//             if(POTracking === null){
//                   return res.status(404).json({
//                         status: false,
//                         message: `PO id incorrect`
//                   })
//             }
//             else if(POTracking.picker.length > 0) {
//                   POTracking.status = "in picking"
//             }

//             await POTracking.save()

//             return res.status(201).send(
//                   {
//                         status: true,
//                         message: "Updated PO Tracking",
//                         poInTracking: POTracking
//                   })
//       }
//       catch (err) {
//             res.status(500).json({
//                   status: false,
//                   message: `${err}`
//             })
//       }
// }

const getPOTracking = async (req, res) => {
      try {
            await search(req, res, '')
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`
            });
      }
}

const getPoPendingForGRN = async (req, res) => {
      try {
            await search(req, res, 'pending for grn')
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`
            });
      }
}

const getPoInGRN = async (req, res) => {
      try {
            await search(req, res, 'in grn')
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`
            });
      }
}

const search = async (req, res, status) => {

      let filter = {
            status
      };

      if(status === ''){
            filter = {};
      }

      if (req.query.filterBy && req.query.value) {
            filter[req.query.filterBy] = req.query.value;
      }

      const pageSize = +req.query.pageSize || 10;
      const currentPage = +req.query.currentPage || 1;
      const sortBy = req.query.sortBy || '_id'; // _id or description or code or po or etc.
      const sortOrder = req.query.sortOrder || 'desc'; // asc or desc

      const totalItems = await POTrackingModel.find(filter).countDocuments();
      const items = await POTrackingModel.find(filter)
            .skip((pageSize * (currentPage - 1)))
            .limit(pageSize)
            .sort({ [sortBy]: sortOrder })
            .exec();

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
      postPOTracking,
      // updatePOTracking,
      getPOTracking,
      getPoPendingForGRN,
      getPoInGRN
}