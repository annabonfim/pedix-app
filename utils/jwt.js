// utils/jwt.js
// Decoder de JWT emitido pela API .NET. Não valida assinatura — só extrai claims.
// A API usa as URIs longas do System.IdentityModel.Tokens.Jwt como nome dos
// campos (convenção do ASP.NET — não são URLs de verdade, só identificadores).

const CLAIM_KEYS = {
  id: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  nome: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
};

function base64UrlDecode(str) {
  // base64-URL → base64 padrão (troca chars url-safe e completa padding)
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  if (typeof atob === 'function') {
    const decoded = atob(s);
    try {
      // atob devolve bytes "crus", não UTF-8. Sem esse %XX dance, nomes com
      // acento (ex: "João") vêm com caracteres quebrados.
      return decodeURIComponent(
        decoded
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (_) {
      return decoded;
    }
  }
  // fallback (Node/teste): Buffer não existe no React Native
  return Buffer.from(s, 'base64').toString('utf-8');
}

// Retorna o payload do JWT como objeto. Lança se o token for malformado.
export function decodeJwt(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token inválido.');
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Token JWT mal formatado.');
  }
  const json = base64UrlDecode(parts[1]);
  return JSON.parse(json);
}

// Monta o objeto user a partir dos claims do JWT da API .NET.
// Retorna { id, nome, email, role } onde role é a string da API ("Cliente"/"Garcom"/"Admin").
export function userFromJwt(token) {
  const payload = decodeJwt(token);
  return {
    id: payload[CLAIM_KEYS.id],
    nome: payload[CLAIM_KEYS.nome],
    email: payload[CLAIM_KEYS.email],
    role: payload[CLAIM_KEYS.role],
    exp: payload.exp,
  };
}

// claim `exp` vem em segundos (epoch); Date.now() em ms — daí o * 1000
export function isJwtExpired(token) {
  try {
    const { exp } = decodeJwt(token);
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch (_) {
    return true;
  }
}
