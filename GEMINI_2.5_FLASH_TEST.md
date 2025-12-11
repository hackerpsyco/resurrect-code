# Gemini 2.5 Flash Test

## Quick Test in Browser Console

Run this in your browser console to test the Gemini 2.5 Flash model:

```javascript
// Test Gemini 2.5 Flash directly
const testGemini25Flash = async () => {
  const apiKey = 'AIzaSyDTxpPj-2Z5OG-aoMqB_fx2KoVNSHfBe2I';
  
  console.log('🧪 Testing Gemini 2.5 Flash...');
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Hello! Please respond with "Gemini 2.5 Flash is working!" to confirm you are operational.' }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100
        }
      })
    });
    
    console.log('📊 Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Full response:', data);
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log('✅ SUCCESS! Gemini 2.5 Flash response:', text);
        alert('✅ Gemini 2.5 Flash is working!\n\nResponse: ' + text);
        
        // Auto-configure for Cline
        const config = {
          provider: 'gemini',
          apiKey: apiKey,
          model: 'gemini-2.5-flash'
        };
        localStorage.setItem('ai_config', JSON.stringify(config));
        console.log('🔧 Auto-configured Cline with Gemini 2.5 Flash');
        
      } else {
        console.error('❌ No text in response');
        alert('❌ No text content in response');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('❌ Error details:', errorText);
      alert(`❌ API Error: ${response.status} ${response.statusText}\n\nCheck console for details.`);
    }
    
  } catch (error) {
    console.error('❌ Network/Fetch Error:', error);
    alert('❌ Network error: ' + error.message);
  }
};

testGemini25Flash();
```

## Expected Results

**If Successful:**
- ✅ Status: 200 OK
- ✅ Response: "Gemini 2.5 Flash is working!" (or similar)
- ✅ Auto-configuration saved to localStorage
- ✅ Ready to use with Cline

**If Failed:**
- ❌ Status: 404 - Model not found (try gemini-1.5-flash instead)
- ❌ Status: 403 - API key invalid or no permissions
- ❌ Status: 429 - Rate limited, try again later

## Alternative Models to Try

If `gemini-2.5-flash` doesn't work, try these in order:

1. **gemini-1.5-flash** (stable free tier)
2. **gemini-2.0-flash-exp** (experimental free tier)
3. **gemini-1.5-pro** (paid tier, if you have credits)

## Manual Configuration

After successful test, you can also configure manually:

1. Go to Cline AI panel → Settings
2. Provider: Google Gemini
3. API Key: `AIzaSyDTxpPj-2Z5OG-aoMqB_fx2KoVNSHfBe2I`
4. Model: `gemini-2.5-flash`
5. Save Configuration
6. Refresh page
7. Test with 🔍 button