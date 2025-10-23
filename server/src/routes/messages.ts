import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Message } from '../models';
import { getIO } from '../socket';

export const messagesRouter = Router();
messagesRouter.use(authenticateJwt);

messagesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    console.log('[MESSAGES][GET] Request by user', { userId: user.sub, role: user.role });

    let results;
    if (user.role === 'admin') {
      results = await Message.find().populate('fromUserId toUserId').sort({ createdAt: -1 });
    } else {
      results = await Message.find({ $or: [{ fromUserId: user.sub }, { toUserId: user.sub }] })
        .populate('fromUserId toUserId')
        .sort({ createdAt: -1 });
    }

    console.log('[MESSAGES][GET] Found messages', { count: Array.isArray(results) ? results.length : 0 });
    return res.json({ messages: Array.isArray(results) ? results : [] });
  } catch (err) {
    console.error('[MESSAGES][GET] Error fetching messages', err);
    return res.status(500).json({ messages: [], error: 'Unable to load messages' });
  }
});

messagesRouter.post('/', async (req: Request, res: Response) => {
  const user = req.user!;
  const { toUserId, content } = req.body ?? {};
  if (!toUserId || !content) return res.status(400).json({ message: 'toUserId and content required' });
  const created = await Message.create({ toUserId, content, fromUserId: user.sub });
  console.log('[MESSAGES][POST] Created message', {
    id: String(created._id),
    from: String(created.fromUserId),
    to: String(created.toUserId),
    at: created.createdAt,
  });
  // Emit real-time events to both participants
  const io = getIO();
  if (io) {
    const payload = {
      _id: String(created._id),
      content: created.content,
      fromUserId: String(created.fromUserId),
      toUserId: String(created.toUserId),
      createdAt: created.createdAt,
    };
    io.to(String(created.toUserId)).emit('message:new', payload);
    io.to(String(created.fromUserId)).emit('message:new', payload);
    console.log('[MESSAGES][POST] Emitted message:new to rooms', {
      toRoom: String(created.toUserId),
      fromRoom: String(created.fromUserId),
      id: String(created._id),
    });
  }
  res.status(201).json(created);
});

messagesRouter.delete('/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
  const deleted = await Message.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

// Get conversation between current user and specified user
messagesRouter.get('/:userId', async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.sub;
    const otherUserId = req.params.userId;
    console.log('[MESSAGES][GET:/:userId] Conversation request', { currentUserId, otherUserId });

    const convo = await Message.find({
      $or: [
        { fromUserId: currentUserId, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: currentUserId },
      ],
    })
      .populate('fromUserId toUserId', 'name email role profilePicture')
      .sort({ createdAt: 1 });

    return res.json({ messages: convo });
  } catch (err) {
    console.error('[MESSAGES][GET:/:userId] Error fetching conversation', err);
    return res.status(500).json({ messages: [], error: 'Unable to load messages' });
  }
});
