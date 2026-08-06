package com.happycreative.productpreview.domain.preview;

import java.util.UUID;

public final class MediaRef {
    private final UUID id;
    private final String url;
    private final String contentType;
    private final long sizeBytes;
    private final String checksum;
    private final String origin;

    public MediaRef(UUID id, String url, String contentType, long sizeBytes, String checksum, String origin) {
        this.id = id;
        this.url = url;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.checksum = checksum;
        this.origin = origin;
    }

    public UUID getId() { return id; }
    public String getUrl() { return url; }
    public String getContentType() { return contentType; }
    public long getSizeBytes() { return sizeBytes; }
    public String getChecksum() { return checksum; }
    public String getOrigin() { return origin; }
}
