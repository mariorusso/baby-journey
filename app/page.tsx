// TODO: This page will be rebuilt to use the presigned URL upload flow.
// See: POST /api/upload/presign → client PUT to R2 → POST /api/upload/confirm

export default function UploadPage() {
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Add a New Moment</h1>
      
      <form className="flex flex-col gap-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
          <input 
            type="file" 
            name="file" 
            accept="image/*" 
            required 
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
          <input 
            type="text" 
            name="caption" 
            placeholder="What happened today?" 
            className="w-full border border-gray-300 p-2 rounded-md"
          />
        </div>

        <button 
          type="submit" 
          className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors mt-2"
        >
          Upload to Database
        </button>
        
      </form>
    </div>
  );
}