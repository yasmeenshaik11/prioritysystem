const API_URL=process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';
export async function api(path,options={}){const token=globalThis.__EAI_TOKEN;const headers={...(options.headers||{})};if(token)headers.Authorization=`Bearer ${token}`;const r=await fetch(`${API_URL}${path}`,{...options,headers});const data=await r.json();if(!r.ok)throw new Error(data.error||'Request failed');return data;}
export {API_URL};
