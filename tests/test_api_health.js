const http = require('http');

console.log("Testing API Health...");

http.get('http://localhost:5000/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.status === 'ok') {
                console.log("Health check passed:", parsed);
            } else {
                console.error("Health check failed:", parsed);
                process.exit(1);
            }
        } catch (e) {
            console.error("Failed to parse response:", data);
            process.exit(1);
        }
    });
}).on('error', (err) => {
    console.error("Backend unreachable:", err.message);
    process.exit(1);
});
