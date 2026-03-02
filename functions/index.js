const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

admin.initializeApp();

exports.notifyConnectMessage = onDocumentCreated('connectMessages/{messageId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const message = snapshot.data();
  if (!message) return;

  const senderId = message.userId || '';
  const senderName = message.name || 'Member';
  const messageText = (message.text || '').toString();

  const profilesSnapshot = await admin.firestore().collection('connectProfiles').get();

  const tokens = [];
  const profileTokens = [];

  profilesSnapshot.forEach((profileDoc) => {
    const profile = profileDoc.data();
    const userTokens = Array.isArray(profile.fcmTokens) ? profile.fcmTokens : [];
    if (profileDoc.id === senderId) return;
    userTokens.forEach((token) => {
      if (typeof token === 'string' && token.trim()) {
        tokens.push(token);
        profileTokens.push({ profileId: profileDoc.id, token });
      }
    });
  });

  if (tokens.length === 0) return;

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: `${senderName} posted in Connect`,
      body: messageText.slice(0, 140) || 'New message in group chat',
    },
    webpush: {
      fcmOptions: {
        link: '/connect',
      },
      notification: {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'connect-chat-message',
        renotify: true,
      },
    },
  });

  const invalidTokenByProfile = new Map();
  response.responses.forEach((result, index) => {
    if (result.success) return;

    const code = result.error?.code || '';
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    ) {
      const pair = profileTokens[index];
      if (!pair) return;
      const existing = invalidTokenByProfile.get(pair.profileId) || [];
      existing.push(pair.token);
      invalidTokenByProfile.set(pair.profileId, existing);
    } else {
      logger.warn('Failed to deliver connect notification', {
        code,
        message: result.error?.message,
      });
    }
  });

  if (invalidTokenByProfile.size > 0) {
    const batch = admin.firestore().batch();
    invalidTokenByProfile.forEach((invalidTokens, profileId) => {
      const profileRef = admin.firestore().collection('connectProfiles').doc(profileId);
      batch.update(profileRef, {
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
      });
    });
    await batch.commit();
  }
});
