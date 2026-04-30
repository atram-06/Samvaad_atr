const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const { authenticateToken } = require('../middleware/auth');

// Create new group
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { memberIds, groupName, groupIcon } = req.body;
        const creatorId = req.user.id;

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ error: 'Member IDs are required' });
        }

        if (!groupName || groupName.trim().length === 0) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        // Ensure creator is in the member list
        const allMemberIds = Array.from(new Set([creatorId, ...memberIds]));

        const conversation = await chatService.createGroupConversation({
            creatorId,
            memberIds: allMemberIds,
            groupName: groupName.trim(),
            groupIcon
        });

        res.json({
            success: true,
            conversation: {
                id: conversation.id,
                type: conversation.type,
                groupName: conversation.groupName,
                groupIcon: conversation.groupIcon,
                createdBy: conversation.createdBy
            }
        });
    } catch (err) {
        console.error('Create group error:', err);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Get group details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { Conversation, GroupMember } = require('../models');
        const conversationId = req.params.id;

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation || conversation.type !== 'group') {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Verify user is a member
        const membership = await GroupMember.findOne({
            where: { conversationId, userId: req.user.id, leftAt: null }
        });

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this group' });
        }

        const members = await chatService.getGroupMembers({ conversationId });

        res.json({
            id: conversation.id,
            groupName: conversation.groupName,
            groupIcon: conversation.groupIcon,
            createdBy: conversation.createdBy,
            memberCount: members.length,
            members: members.map(m => ({
                userId: m.userId,
                role: m.role,
                joinedAt: m.joinedAt,
                user: m.User
            }))
        });
    } catch (err) {
        console.error('Get group error:', err);
        res.status(500).json({ error: 'Failed to get group details' });
    }
});

// Update group info
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { groupName, groupIcon } = req.body;
        const conversationId = req.params.id;

        const conversation = await chatService.updateGroupInfo({
            conversationId,
            groupName,
            groupIcon,
            updatedBy: req.user.id
        });

        res.json({
            success: true,
            conversation: {
                id: conversation.id,
                groupName: conversation.groupName,
                groupIcon: conversation.groupIcon
            }
        });
    } catch (err) {
        console.error('Update group error:', err);
        if (err.message === 'Only admins can update group info') {
            return res.status(403).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to update group' });
    }
});

// Add members to group
router.post('/:id/members', authenticateToken, async (req, res) => {
    try {
        const { memberIds } = req.body;
        const conversationId = req.params.id;

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ error: 'Member IDs are required' });
        }

        await chatService.addGroupMembers({
            conversationId,
            memberIds,
            addedBy: req.user.id
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Add members error:', err);
        if (err.message === 'Only admins can add members') {
            return res.status(403).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to add members' });
    }
});

// Remove member from group
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const userId = parseInt(req.params.userId);

        await chatService.removeGroupMember({
            conversationId,
            userId,
            removedBy: req.user.id
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Remove member error:', err);
        if (err.message === 'Only admins can remove members') {
            return res.status(403).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// Leave group
router.post('/:id/leave', authenticateToken, async (req, res) => {
    try {
        const conversationId = req.params.id;

        await chatService.leaveGroup({
            conversationId,
            userId: req.user.id
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Leave group error:', err);
        res.status(500).json({ error: 'Failed to leave group' });
    }
});

// Get group members
router.get('/:id/members', authenticateToken, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { GroupMember } = require('../models');

        // Verify user is a member
        const membership = await GroupMember.findOne({
            where: { conversationId, userId: req.user.id, leftAt: null }
        });

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this group' });
        }

        const members = await chatService.getGroupMembers({ conversationId });

        res.json({
            members: members.map(m => ({
                userId: m.userId,
                role: m.role,
                joinedAt: m.joinedAt,
                user: m.User
            }))
        });
    } catch (err) {
        console.error('Get members error:', err);
        res.status(500).json({ error: 'Failed to get members' });
    }
});

// Delete Group
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBy = req.user.id;

        await chatService.deleteGroup({ conversationId: id, deletedBy });

        res.json({ message: 'Group deleted successfully' });
    } catch (err) {
        console.error('Delete group error:', err);
        if (err.message === 'Only admins can delete the group') {
            res.status(403).json({ error: err.message });
        } else if (err.message === 'Invalid group conversation') {
            res.status(404).json({ error: err.message });
        } else {
            res.status(500).json({ error: 'Failed to delete group' });
        }
    }
});

module.exports = router;
