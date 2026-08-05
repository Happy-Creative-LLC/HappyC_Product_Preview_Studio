package com.happycreative.productpreview.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    private Provider provider = Provider.LOCAL;
    private String keyPrefix = "product-previews";
    private Local local = new Local();
    private R2 r2 = new R2();

    public enum Provider {
        LOCAL,
        R2
    }

    @Getter
    @Setter
    public static class Local {
        private String directory = "uploads";
    }

    @Getter
    @Setter
    public static class R2 {
        private String accountId;
        private String accessKeyId;
        private String secretAccessKey;
        private String bucket;
        private String publicBaseUrl;
    }
}
