package com.medicare.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

@Configuration
@Profile("production")
public class ProductionDataSourceConfig {

    @Bean
    public DataSource dataSource(Environment environment) {
        HikariConfig config = new HikariConfig();
        config.setPoolName("MediCareProductionPool");
        config.setJdbcUrl("jdbc:postgresql://"
                + required(environment, "PGHOST")
                + ":" + environment.getProperty("PGPORT", "5432")
                + "/" + required(environment, "PGDATABASE"));
        config.setUsername(required(environment, "PGUSER"));
        config.setPassword(required(environment, "PGPASSWORD"));
        config.setMaximumPoolSize(environment.getProperty("DB_POOL_SIZE", Integer.class, 10));
        config.setConnectionTimeout(30_000);
        return new HikariDataSource(config);
    }

    private static String required(Environment environment, String key) {
        String value = environment.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required PostgreSQL environment variable: " + key);
        }
        return value;
    }
}