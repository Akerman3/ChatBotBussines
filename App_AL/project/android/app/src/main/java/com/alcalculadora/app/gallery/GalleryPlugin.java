package com.alcalculadora.app.gallery;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.Base64;
import android.os.Build;
import android.os.Environment;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginCall;

import org.json.JSONException;

import java.io.OutputStream;
import java.io.IOException;

@CapacitorPlugin(name = "Gallery")
public class GalleryPlugin extends Plugin {

    @PluginMethod
    public void saveImageToGallery(PluginCall call) {
      String base64Data = call.getString("base64Data");
      String fileName = call.getString("fileName");

      if (base64Data == null || base64Data.isEmpty()) {
        call.reject("base64Data is required");
        return;
      }

      if (fileName == null || fileName.isEmpty()) {
        fileName = "alcalculadora_" + System.currentTimeMillis() + ".jpg";
      }

      try {
        byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
        Bitmap bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);

        if (bitmap == null) {
          call.reject("Failed to decode base64 to bitmap");
          return;
        }

        ContentResolver resolver = getContext().getContentResolver();
        ContentValues contentValues = new ContentValues();

        contentValues.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
        contentValues.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");

        // Carpeta: Pictures/ALCalculadora
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          String relativePath = Environment.DIRECTORY_PICTURES + "/ALCalculadora";
          contentValues.put(MediaStore.Images.Media.RELATIVE_PATH, relativePath);
        }

        Uri imageUri = resolver.insert(
          MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
          contentValues
        );

        if (imageUri == null) {
          call.reject("Failed to insert image in MediaStore");
          return;
        }

        OutputStream out = null;
        try {
          out = resolver.openOutputStream(imageUri);
          if (out == null) {
            call.reject("Failed to open output stream");
            return;
          }
          bitmap.compress(Bitmap.CompressFormat.JPEG, 95, out);
        } finally {
          if (out != null) {
            out.close();
          }
        }

        // Respuesta a JS
        com.getcapacitor.JSObject result = new com.getcapacitor.JSObject();
        result.put("uri", imageUri.toString());
        call.resolve(result);

      } catch (IOException e) {
        e.printStackTrace();
        call.reject("IO error while saving image: " + e.getMessage());
      } catch (Exception e) {
        e.printStackTrace();
        call.reject("Unexpected error: " + e.getMessage());
      }
    }
}
