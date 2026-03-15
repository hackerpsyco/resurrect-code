// import { supabase } from '../lib/supabase'
const supabase = new Proxy({}, { get: () => () => ({ data: {}, error: null }) }); // Mocked for removal

export default function ConnectGitHub() {
  const connect = () => supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      scopes: 'repo workflow read:user',
      redirectTo: `${window.location.origin}/dashboard`
    }
  })
  return (
    <button 
      onClick={connect}
      className="bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-2 rounded-md font-medium transition-colors"
    >
      Connect GitHub
    </button>
  )
}
