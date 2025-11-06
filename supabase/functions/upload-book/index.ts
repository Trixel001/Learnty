Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { fileData, fileName, fileType, title, author } = await req.json();

    if (!fileData || !fileName) {
      throw new Error('File data and filename are required');
    }

    // Get configuration from environment
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('Invalid token');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Extract base64 data
    const base64Data = fileData.split(',')[1] || fileData;
    const mimeType = fileType || 'application/pdf';

    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Generate storage path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload to Supabase Storage
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/learnty-storage/${storagePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': mimeType,
          'x-upsert': 'true'
        },
        body: binaryData
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    // Get public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/learnty-storage/${storagePath}`;

    // Create book record in database
    const bookData = {
      user_id: userId,
      title: title || fileName.replace(/\.[^/.]+$/, ''),
      author: author || 'Unknown',
      file_url: publicUrl,
      file_type: fileType || 'application/pdf',
      upload_date: new Date().toISOString(),
      processing_status: 'uploaded',
      ai_analysis: null
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/books`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(bookData)
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      throw new Error(`Database insert failed: ${errorText}`);
    }

    const books = await insertResponse.json();
    const book = books[0];

    // Update achievement progress (First Book Upload)
    const achievementResponse = await fetch(`${supabaseUrl}/functions/v1/award-achievement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        achievementType: 'milestone'
      })
    });

    return new Response(JSON.stringify({
      data: {
        book,
        publicUrl
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Book upload error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'BOOK_UPLOAD_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
