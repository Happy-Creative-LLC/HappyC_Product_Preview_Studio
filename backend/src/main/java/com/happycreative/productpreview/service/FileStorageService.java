package com.happycreative.productpreview.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Storage boundary used by preview business logic.
 *
 * <p>Implementations must return a browser-ready URL and must silently ignore
 * delete requests for URLs they do not own. This keeps preview data independent
 * from the active storage provider.</p>
 */
public interface FileStorageService {

    String storeFile(MultipartFile file);

    boolean deleteFile(String fileUrl);
}
