package com.happycreative.productpreview.domain.preview;

import java.util.Objects;
import java.util.UUID;

public final class PreviewId {
    private final UUID id;

    private PreviewId(UUID id) { this.id = id; }

    public static PreviewId of(UUID id) { return new PreviewId(id); }
    public UUID toUUID() { return id; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PreviewId previewId = (PreviewId) o;
        return Objects.equals(id, previewId.id);
    }

    @Override
    public int hashCode() { return Objects.hash(id); }
    @Override
    public String toString() { return id.toString(); }
}
