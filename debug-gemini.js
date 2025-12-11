// Simple Gemini API test
async function testGeminiDirect() {
    const apiKey = 'AIzaSyDRSAYQSZjL-qmIVpuZKShfYxdo8MBliL0';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
        contents: [{
            parts: [{ text: 'Write a simple JavaScript function that adds two numbers. Return only the code.' }]
        }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200
        }
    };
    
    console.log('🔍 Testing Gemini API directly...');
    console.log('📤 Request:', requestBody);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📥 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error:', errorText);
            return;
        }
        
        const data = await response.json();
        console.log('📦 Full response:', data);
        
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            console.log('✅ Generated text:', text);
        } else {
            console.log('❌ No text in response');
        }
        
    } catch (error) {
        console.error('❌ Fetch error:', error);
    }
}

// Run the test
testGeminiDirect();