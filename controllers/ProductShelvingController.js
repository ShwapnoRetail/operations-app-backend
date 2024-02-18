const ProductShelvingModel = require('../models/ProductShelvingModel')
const mongoose = require('mongoose')

// Assign a product to ready for shelving
const assignToReadyForShelving = async (req, res) => {
      try {
            const { po, code, quantity, receivedQuantity } = req.body
            const filter = {
                  po,
                  code,
                  quantity
            }

            const isAlreadyReadyForShelving = Boolean(await ProductShelvingModel.findOne(filter))

            if (isAlreadyReadyForShelving) {
                  return res.status(409).send({
                        status: false,
                        message: `Material ${code} with quantity of ${quantity} of PO ${po} has already been assigned.`
                  })
            }
            else if(receivedQuantity > quantity){
                  return res.status(409).send({
                        status: false,
                        message: `Received Quantity ${receivedQuantity} cannot exceed PO Quantity ${quantity}`
                  })
            }
            else {
                  const data = await ProductShelvingModel.create(req.body)

                  return res.status(201).send({
                        status: true,
                        message: `Material ${code} is ready for shelving`,
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

// Get ready for shelving products
const getReadyForShelving = async (req, res) => {
      try {
            await search(req, res, 'ready for shelving')
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`
            });
      }
}

// Update Products in Shelf
const updateProductInShelf = async (req, res) => {
      try {
            const { id } = req.params
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                  return res.status(404).json({
                        status: false,
                        message: `Product Id incorrect`
                  })
            }

            let readyForShelvingProduct = await ProductShelvingModel.findById(id)

            if(readyForShelvingProduct === null){
                  return res.status(404).json({
                        status: false,
                        message: `Product Id incorrect`
                  })
            }

            const quantity = readyForShelvingProduct.inShelf.reduce((a, c) => a + c.quantity, 0) + req.body.quantity
            const receivedQuantity = readyForShelvingProduct.receivedQuantity

            if (quantity > receivedQuantity) {
                  return res.status(409).json({
                        status: false,
                        message: `Input Quantity and Shelf Quantity Exceed the received quantity.`
                  })
            }
            else if (quantity < receivedQuantity) {
                  readyForShelvingProduct.inShelf.push(req.body)
                  readyForShelvingProduct.status = 'partially in shelf'
            }
            else {
                  readyForShelvingProduct.inShelf.push(req.body)
                  readyForShelvingProduct.status = 'in shelf'
            }

            await readyForShelvingProduct.save()

            return res.status(201).send(
                  {
                        status: true,
                        message: "Assigned to shelf",
                        readyForShelvingProduct,
                  })
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`
            })
      }
}

//  Get Partially in Shelf Products
const getPartiallyInShelf = async (req, res) => {
      try {
            await search(req, res, 'partially in shelf')
      }
      catch (err) {
            res.status(500).json({
                  status: false,
                  message: `${err}`
            });
      }
}

// Get in shelf products
const getInShelf = async (req, res) => {
      try {
            await search(req, res, 'in shelf')
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
      
      if (status === '') {
            filter = {};
      }

      if (req.query.filterBy && req.query.value) {
            filter[req.query.filterBy] = req.query.value;
      }

      const pageSize = +req.query.pageSize || 10;
      const currentPage = +req.query.currentPage || 1;
      const sortBy = req.query.sortBy || '_id'; // _id or description or code or po or etc.
      const sortOrder = req.query.sortOrder || 'desc'; // asc or desc

      const totalItems = await ProductShelvingModel.find(filter).countDocuments();
      const items = await ProductShelvingModel.find(filter)
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

      if(items.length) {
            return res.status(200).json(responseObject);
      }

      else {
            return res.status(401).json({
                  status: false,
                  message:"Nothing found",
                  items
            });
      }
}

module.exports = {
      assignToReadyForShelving,
      getReadyForShelving,
      updateProductInShelf,
      getPartiallyInShelf,
      getInShelf
}