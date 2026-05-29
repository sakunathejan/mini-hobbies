import express from "express";
import { protect, adminOnly, auditLog } from "../middleware/authMiddleware.js";
import * as adminChat from "../controllers/admin/adminChatController.js";
import * as adminKnowledge from "../controllers/admin/adminKnowledgeController.js";
import * as adminConfig from "../controllers/admin/adminChatConfigController.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/dashboard", adminChat.getDashboard);

router.get("/conversations", adminChat.getConversations);
router.get("/conversations/:sessionId", auditLog("view_chat_conversation", "ChatSession"), adminChat.getConversation);
router.patch("/conversations/:sessionId/resolve", auditLog("resolve_chat", "ChatSession"), adminChat.resolveConversation);
router.patch("/conversations/:sessionId/messages/:messageId/flag", auditLog("flag_chat_message", "ChatSession"), adminChat.flagMessage);

router.get("/analytics", adminChat.getAnalytics);
router.get("/export", auditLog("export_chats", "ChatSession"), adminChat.exportConversations);

router.get("/knowledge", adminKnowledge.listKnowledge);
router.get("/knowledge/:id", adminKnowledge.getKnowledge);
router.post("/knowledge", auditLog("create_knowledge", "ChatKnowledgeBase"), adminKnowledge.createKnowledge);
router.put("/knowledge/:id", auditLog("update_knowledge", "ChatKnowledgeBase"), adminKnowledge.updateKnowledge);
router.delete("/knowledge/:id", auditLog("delete_knowledge", "ChatKnowledgeBase"), adminKnowledge.deleteKnowledge);
router.post("/knowledge/import", auditLog("import_knowledge", "ChatKnowledgeBase"), adminKnowledge.bulkImportKnowledge);
router.post("/knowledge/test", adminKnowledge.testKnowledgeMatch);

router.get("/config", adminConfig.getConfig);
router.put("/config", auditLog("update_chat_config", "ChatConfig"), adminConfig.updateConfig);
router.patch("/config", auditLog("bulk_update_chat_config", "ChatConfig"), adminConfig.updateConfigBulk);
router.delete("/config/:key", auditLog("reset_chat_config", "ChatConfig"), adminConfig.resetConfig);

router.post("/test", adminConfig.testResponse);

router.get("/unanswered", adminConfig.getUnansweredQueries);
router.post("/unanswered/:id/resolve", auditLog("resolve_unanswered", "ChatUnansweredQuery"), adminConfig.resolveUnanswered);

export default router;
