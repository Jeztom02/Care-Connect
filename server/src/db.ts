import mongoose from 'mongoose';

export async function connectMongo(uri: string) {
  if (mongoose.connection.readyState === 1) return;
  const isLocal = uri.startsWith('mongodb://');
  const hasQuery = uri.includes('?');
  const shouldDisableTls = isLocal && !uri.includes('tls=');
  const finalUri = shouldDisableTls && !hasQuery ? `${uri}?tls=false` : shouldDisableTls ? `${uri}&tls=false` : uri;
  const allowInsecure = (process.env.MONGODB_TLS_INSECURE || '').toLowerCase() === 'true';
  await mongoose.connect(finalUri, allowInsecure ? { tlsAllowInvalidCertificates: true } : undefined);
}
