import express, { Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Equipment, EquipmentTransaction } from '../models/equipment';
import { UsedEquipmentSale } from '../models/usedEquipmentSale';
import { User } from '../models';

const router = express.Router();

// Get all equipment (Public or Authenticated)
// Filters: category, condition, minPrice, maxPrice, sellerType
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, condition, minPrice, maxPrice, sellerType, search } = req.query;
    const query: any = { status: 'Available', isVerified: true };

    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (sellerType) query.sellerType = sellerType;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const equipment = await Equipment.find(query).sort({ createdAt: -1 });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching equipment', error });
  }
});

// Get my listings (Seller)
router.get('/my-listings', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.find({ sellerId: req.user?.sub }).sort({ createdAt: -1 });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listings', error });
  }
});

// Get pending approvals (Admin only)
router.get('/pending', authenticateJwt, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.find({ isVerified: false, status: 'Available' }).populate('sellerId', 'name email');
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending approvals', error });
  }
});

// Get single equipment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.findById(req.params.id).populate('sellerId', 'name role');
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching equipment', error });
  }
});

// Admin: list all equipment transactions
router.get('/admin/transactions', authenticateJwt, authorizeRoles('admin'), async (_req: Request, res: Response) => {
  try {
    const txs = await EquipmentTransaction.find().sort({ createdAt: -1 }).populate('equipmentId buyerId sellerId');
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list transactions', error: err });
  }
});

// Admin: list all used equipment sales
router.get('/admin/sales', authenticateJwt, authorizeRoles('admin'), async (_req: Request, res: Response) => {
  try {
    const sales = await UsedEquipmentSale.find().sort({ createdAt: -1 }).populate('equipmentId buyerId sellerId');
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list sales', error: err });
  }
});

// Create listing
router.post('/', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const { name, description, category, condition, price, images, location, contactPhone } = req.body;

    // Enforce role rules: admins should not list items (Admin UI is for approvals)
    if (req.user?.role === 'admin') {
      return res.status(403).json({ message: 'Admins are not allowed to create equipment listings' });
    }

    // Map user role to sellerType and verification status
    const role = String(req.user?.role || '').toLowerCase();
    let isAutoVerified = false;
    let sellerType: 'Hospital' | 'Patient' | 'Admin' = 'Patient';

    if (role === 'patient') {
      sellerType = 'Patient';
      isAutoVerified = false; // patient listings require admin approval
    } else if (role === 'doctor' || role === 'nurse') {
      sellerType = 'Hospital';
      isAutoVerified = true; // hospital staff listings auto-verified
    } else {
      // Default: treat unknown roles as patient (requires approval)
      sellerType = 'Patient';
      isAutoVerified = false;
    }

    const equipment = new Equipment({
      name,
      description,
      category,
      condition,
      price,
      sellerId: req.user?.sub,
      sellerType,
      images,
      location,
      contactPhone,
      isVerified: isAutoVerified,
      status: 'Available'
    });

    await equipment.save();
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating listing', error });
  }
});

// Update listing
router.put('/:id', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

    // Check ownership or admin
    if (equipment.sellerId.toString() !== req.user?.sub && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    Object.assign(equipment, req.body);
    // If critical fields changed by patient, maybe reset verification? For now, keep simple.
    
    await equipment.save();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating listing', error });
  }
});

// Approve listing (Admin)
router.put('/:id/approve', authenticateJwt, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

    equipment.isVerified = true;
    await equipment.save();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Error approving listing', error });
  }
});

// Buy equipment (Patient)
router.post('/:id/buy', authenticateJwt, authorizeRoles('patient'), async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
    if (equipment.status !== 'Available') return res.status(400).json({ message: 'Equipment not available' });
    if (!equipment.isVerified) return res.status(400).json({ message: 'Equipment not verified' });

    // Create transaction record
    const transaction = new EquipmentTransaction({
      equipmentId: equipment._id,
      buyerId: req.user?.sub,
      sellerId: equipment.sellerId,
      amount: equipment.price,
      status: 'Completed', // Assuming instant payment for now
      paymentMethod: 'Credit Card' // Mock
    });

    await transaction.save();

    // Also create a UsedEquipmentSale record for separate sales tracking
    try {
      const sale = new UsedEquipmentSale({
        equipmentId: equipment._id,
        buyerId: req.user?.sub,
        sellerId: equipment.sellerId,
        amount: equipment.price,
        paymentMethod: 'Credit Card',
        status: 'Completed'
      });
      await sale.save();
    } catch (err) {
      // Log but do not fail purchase if sales record creation fails
      // eslint-disable-next-line no-console
      console.error('Failed to create UsedEquipmentSale record', err);
    }

    // Update equipment status
    equipment.status = 'Sold';
    await equipment.save();

    res.json({ message: 'Purchase successful', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error processing purchase', error });
  }
});

// Delete listing
router.delete('/:id', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

    if (equipment.sellerId.toString() !== req.user?.sub && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await equipment.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting listing', error });
  }
});

export const equipmentRouter = router;
